"""
PyCaret AutoML FastAPI Backend
Full AutoML capabilities: Classification, Regression, Clustering, Anomaly Detection, Time Series, Association Rules
"""

import os
import io
import json
import base64
import uuid
import traceback
import warnings
from typing import Optional, List, Dict, Any
from pathlib import Path

import pandas as pd
import numpy as np
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

warnings.filterwarnings("ignore")
os.environ["MPLBACKEND"] = "Agg"

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

app = FastAPI(title="PyCaret AutoML API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store sessions and models in memory
sessions: Dict[str, Any] = {}
UPLOAD_DIR = Path("/tmp/pycaret_uploads")
UPLOAD_DIR.mkdir(exist_ok=True)
MODEL_DIR = Path("/tmp/pycaret_models")
MODEL_DIR.mkdir(exist_ok=True)
PLOT_DIR = Path("/tmp/pycaret_plots")
PLOT_DIR.mkdir(exist_ok=True)


def fig_to_base64(fig=None) -> str:
    """Convert matplotlib figure to base64 string."""
    buf = io.BytesIO()
    if fig is None:
        fig = plt.gcf()
    fig.savefig(buf, format="png", dpi=100, bbox_inches="tight", facecolor="white")
    buf.seek(0)
    b64 = base64.b64encode(buf.read()).decode("utf-8")
    plt.close(fig)
    buf.close()
    return b64


def safe_serialize(obj: Any) -> Any:
    """Safely serialize objects for JSON."""
    if obj is None:
        return None
    if isinstance(obj, (int, float, str, bool)):
        if isinstance(obj, float) and (np.isnan(obj) or np.isinf(obj)):
            return None
        return obj
    if isinstance(obj, (np.integer,)):
        return int(obj)
    if isinstance(obj, (np.floating,)):
        v = float(obj)
        return None if np.isnan(v) or np.isinf(v) else v
    if isinstance(obj, np.bool_):
        return bool(obj)
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    if isinstance(obj, pd.DataFrame):
        return json.loads(obj.to_json(orient="records", default_handler=str))
    if isinstance(obj, pd.Series):
        return json.loads(obj.to_json(default_handler=str))
    if isinstance(obj, dict):
        return {str(k): safe_serialize(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [safe_serialize(v) for v in obj]
    return str(obj)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "PyCaret AutoML"}


@app.post("/upload")
async def upload_csv(file: UploadFile = File(...)):
    """Upload a CSV file and return data preview + column analysis."""
    try:
        content = await file.read()
        session_id = str(uuid.uuid4())
        
        # Try different encodings
        for encoding in ["utf-8", "latin-1", "cp1252", "iso-8859-1"]:
            try:
                df = pd.read_csv(io.BytesIO(content), encoding=encoding)
                break
            except Exception:
                continue
        else:
            raise HTTPException(status_code=400, detail="Could not parse CSV file")

        # Store in session
        file_path = UPLOAD_DIR / f"{session_id}.csv"
        df.to_csv(file_path, index=False)
        sessions[session_id] = {"df": df, "file_path": str(file_path)}

        # Analyze columns
        columns_info = []
        for col in df.columns:
            col_info = {
                "name": col,
                "dtype": str(df[col].dtype),
                "non_null": int(df[col].notna().sum()),
                "null_count": int(df[col].isna().sum()),
                "unique": int(df[col].nunique()),
                "sample_values": [str(v) for v in df[col].dropna().head(5).tolist()],
            }
            if pd.api.types.is_numeric_dtype(df[col]):
                col_info["type"] = "numeric"
                desc = df[col].describe()
                col_info["min"] = safe_serialize(desc.get("min"))
                col_info["max"] = safe_serialize(desc.get("max"))
                col_info["mean"] = safe_serialize(desc.get("mean"))
                col_info["std"] = safe_serialize(desc.get("std"))
                col_info["median"] = safe_serialize(df[col].median())
            elif pd.api.types.is_datetime64_any_dtype(df[col]):
                col_info["type"] = "datetime"
            else:
                col_info["type"] = "categorical"
                top_vals = df[col].value_counts().head(10)
                col_info["top_values"] = {str(k): int(v) for k, v in top_vals.items()}

            columns_info.append(col_info)

        # Determine possible ML tasks
        possible_tasks = []
        has_numeric_target = any(c["type"] == "numeric" for c in columns_info)
        has_categorical_target = any(c["type"] == "categorical" for c in columns_info)
        has_datetime = any(c["type"] == "datetime" for c in columns_info)
        
        if has_categorical_target:
            possible_tasks.append({
                "type": "classification",
                "label": "Classification",
                "description": "Predict categorical outcomes (e.g., Yes/No, categories)",
                "requires_target": True
            })
        if has_numeric_target:
            possible_tasks.append({
                "type": "regression",
                "label": "Regression",
                "description": "Predict continuous numeric values",
                "requires_target": True
            })
        # Always offer these
        possible_tasks.extend([
            {
                "type": "clustering",
                "label": "Clustering",
                "description": "Group similar data points together (unsupervised)",
                "requires_target": False
            },
            {
                "type": "anomaly_detection",
                "label": "Anomaly Detection",
                "description": "Detect outliers and unusual data points",
                "requires_target": False
            },
        ])
        if has_numeric_target and has_datetime:
            possible_tasks.append({
                "type": "time_series",
                "label": "Time Series Forecasting",
                "description": "Forecast future values based on temporal patterns",
                "requires_target": True
            })

        return {
            "session_id": session_id,
            "filename": file.filename,
            "shape": {"rows": len(df), "columns": len(df.columns)},
            "columns": columns_info,
            "preview": json.loads(df.head(10).to_json(orient="records", default_handler=str)),
            "possible_tasks": possible_tasks,
            "missing_values": int(df.isnull().sum().sum()),
            "duplicate_rows": int(df.duplicated().sum()),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/automl/setup")
async def automl_setup(
    session_id: str = Form(...),
    task_type: str = Form(...),
    target: Optional[str] = Form(None),
    train_size: float = Form(0.7),
    normalize: bool = Form(False),
    feature_selection: bool = Form(False),
    remove_outliers: bool = Form(False),
    polynomial_features: bool = Form(False),
    fix_imbalance: bool = Form(False),
    pca: bool = Form(False),
    pca_components: Optional[float] = Form(None),
    ignore_features: Optional[str] = Form(None),
    numeric_imputation: str = Form("mean"),
    categorical_imputation: str = Form("mode"),
    transformation: bool = Form(False),
    normalize_method: str = Form("zscore"),
    n_clusters: int = Form(4),
    anomaly_fraction: float = Form(0.05),
    fold: int = Form(10),
    fh: int = Form(12),
    seasonal_period: Optional[int] = Form(None),
):
    """Setup PyCaret experiment for the specified ML task."""
    try:
        if session_id not in sessions:
            raise HTTPException(status_code=404, detail="Session not found. Upload a CSV first.")

        df = sessions[session_id]["df"].copy()
        steps = []
        
        ignore_list = [f.strip() for f in ignore_features.split(",")] if ignore_features else None

        if task_type == "classification":
            from pycaret.classification import ClassificationExperiment
            exp = ClassificationExperiment()
            
            if not target:
                raise HTTPException(status_code=400, detail="Target column required for classification")
            
            # Auto-detect if target needs conversion
            if df[target].nunique() > 50:
                steps.append({"step": "Warning", "detail": f"Target '{target}' has {df[target].nunique()} unique values. Consider regression instead."})

            setup_params = dict(
                data=df, target=target, session_id=123,
                train_size=train_size, fold=fold,
                normalize=normalize, normalize_method=normalize_method,
                feature_selection=feature_selection,
                remove_outliers=remove_outliers,
                polynomial_features=polynomial_features,
                fix_imbalance=fix_imbalance,
                numeric_imputation=numeric_imputation,
                categorical_imputation=categorical_imputation,
                transformation=transformation,
                pca=pca, html=False, verbose=False,
            )
            if pca and pca_components:
                setup_params["pca_components"] = pca_components
            if ignore_list:
                setup_params["ignore_features"] = ignore_list

            exp.setup(**setup_params)
            steps.append({"step": "Setup Complete", "detail": f"Classification experiment initialized. Target: {target}, Training size: {train_size}"})

        elif task_type == "regression":
            from pycaret.regression import RegressionExperiment
            exp = RegressionExperiment()
            
            if not target:
                raise HTTPException(status_code=400, detail="Target column required for regression")

            setup_params = dict(
                data=df, target=target, session_id=123,
                train_size=train_size, fold=fold,
                normalize=normalize, normalize_method=normalize_method,
                feature_selection=feature_selection,
                remove_outliers=remove_outliers,
                polynomial_features=polynomial_features,
                numeric_imputation=numeric_imputation,
                categorical_imputation=categorical_imputation,
                transformation=transformation,
                pca=pca, html=False, verbose=False,
            )
            if pca and pca_components:
                setup_params["pca_components"] = pca_components
            if ignore_list:
                setup_params["ignore_features"] = ignore_list

            exp.setup(**setup_params)
            steps.append({"step": "Setup Complete", "detail": f"Regression experiment initialized. Target: {target}, Training size: {train_size}"})

        elif task_type == "clustering":
            from pycaret.clustering import ClusteringExperiment
            exp = ClusteringExperiment()

            setup_params = dict(
                data=df, session_id=123,
                normalize=normalize, normalize_method=normalize_method,
                transformation=transformation,
                pca=pca, html=False, verbose=False,
            )
            if pca and pca_components:
                setup_params["pca_components"] = pca_components
            if ignore_list:
                setup_params["ignore_features"] = ignore_list

            exp.setup(**setup_params)
            steps.append({"step": "Setup Complete", "detail": f"Clustering experiment initialized. Samples: {len(df)}"})

        elif task_type == "anomaly_detection":
            from pycaret.anomaly import AnomalyExperiment
            exp = AnomalyExperiment()

            setup_params = dict(
                data=df, session_id=123,
                normalize=normalize, normalize_method=normalize_method,
                transformation=transformation,
                pca=pca, html=False, verbose=False,
            )
            if pca and pca_components:
                setup_params["pca_components"] = pca_components
            if ignore_list:
                setup_params["ignore_features"] = ignore_list

            exp.setup(**setup_params)
            steps.append({"step": "Setup Complete", "detail": f"Anomaly Detection experiment initialized. Samples: {len(df)}"})

        elif task_type == "time_series":
            from pycaret.time_series import TSForecastingExperiment
            exp = TSForecastingExperiment()

            if not target:
                raise HTTPException(status_code=400, detail="Target column required for time series")

            setup_params = dict(
                data=df, target=target, session_id=123,
                fh=fh, html=False, verbose=False,
            )
            if seasonal_period:
                setup_params["seasonal_period"] = seasonal_period

            exp.setup(**setup_params)
            steps.append({"step": "Setup Complete", "detail": f"Time Series experiment initialized. Target: {target}, Forecast horizon: {fh}"})

        else:
            raise HTTPException(status_code=400, detail=f"Unknown task type: {task_type}")

        # Get setup summary
        try:
            setup_df = exp.pull()
            setup_summary = json.loads(setup_df.to_json(orient="records", default_handler=str))
            steps.append({"step": "Data Preprocessing", "detail": "Data preprocessed successfully", "data": setup_summary})
        except Exception:
            pass

        # Store experiment
        sessions[session_id]["experiment"] = exp
        sessions[session_id]["task_type"] = task_type
        sessions[session_id]["target"] = target

        return {
            "session_id": session_id,
            "task_type": task_type,
            "steps": steps,
            "status": "setup_complete",
            "available_actions": get_available_actions(task_type),
        }

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


def get_available_actions(task_type: str) -> List[Dict[str, str]]:
    """Get available actions based on task type."""
    if task_type in ["classification", "regression"]:
        return [
            {"action": "compare_models", "label": "Compare Models", "description": "Train & compare all available models"},
            {"action": "tune_model", "label": "Tune Best Model", "description": "Hyperparameter tune the best model"},
            {"action": "ensemble_model", "label": "Ensemble Model", "description": "Create ensemble of the best model"},
            {"action": "blend_models", "label": "Blend Models", "description": "Blend top models together"},
            {"action": "stack_models", "label": "Stack Models", "description": "Stack top models together"},
            {"action": "calibrate_model", "label": "Calibrate Model", "description": "Calibrate model probabilities (classification only)"},
            {"action": "interpret_model", "label": "Interpret Model", "description": "Generate SHAP & feature importance plots"},
            {"action": "plot_model", "label": "Plot Model Analysis", "description": "Generate all analysis plots"},
            {"action": "predict", "label": "Generate Predictions", "description": "Generate predictions on test set"},
            {"action": "finalize_model", "label": "Finalize Model", "description": "Train on full dataset for production"},
            {"action": "save_model", "label": "Save Model", "description": "Save the model pipeline"},
            {"action": "get_leaderboard", "label": "Get Leaderboard", "description": "View model comparison leaderboard"},
        ]
    elif task_type == "clustering":
        return [
            {"action": "create_model", "label": "Create Clustering Model", "description": "Create a clustering model"},
            {"action": "plot_model", "label": "Plot Clusters", "description": "Visualize clusters"},
            {"action": "assign_model", "label": "Assign Clusters", "description": "Assign cluster labels to data"},
            {"action": "get_leaderboard", "label": "Compare Models", "description": "Compare clustering algorithms"},
        ]
    elif task_type == "anomaly_detection":
        return [
            {"action": "create_model", "label": "Create Anomaly Detector", "description": "Create an anomaly detection model"},
            {"action": "plot_model", "label": "Plot Anomalies", "description": "Visualize detected anomalies"},
            {"action": "assign_model", "label": "Assign Anomaly Labels", "description": "Label data as normal/anomaly"},
            {"action": "get_leaderboard", "label": "Compare Models", "description": "Compare anomaly detection algorithms"},
        ]
    elif task_type == "time_series":
        return [
            {"action": "compare_models", "label": "Compare Models", "description": "Compare time series models"},
            {"action": "tune_model", "label": "Tune Best Model", "description": "Hyperparameter tune the best model"},
            {"action": "blend_models", "label": "Blend Models", "description": "Blend top models"},
            {"action": "plot_model", "label": "Plot Forecast", "description": "Plot forecasting results"},
            {"action": "predict", "label": "Generate Forecast", "description": "Generate future predictions"},
            {"action": "finalize_model", "label": "Finalize Model", "description": "Train on full dataset"},
        ]
    return []


@app.post("/automl/compare_models")
async def compare_models(
    session_id: str = Form(...),
    n_select: int = Form(5),
    sort: Optional[str] = Form(None),
    include: Optional[str] = Form(None),
    exclude: Optional[str] = Form(None),
):
    """Compare all models and return leaderboard."""
    try:
        if session_id not in sessions or "experiment" not in sessions[session_id]:
            raise HTTPException(status_code=404, detail="No active experiment. Run setup first.")

        exp = sessions[session_id]["experiment"]
        task_type = sessions[session_id]["task_type"]

        params = {"n_select": n_select, "verbose": False}
        if sort:
            params["sort"] = sort
        if include:
            params["include"] = [m.strip() for m in include.split(",")]
        if exclude:
            params["exclude"] = [m.strip() for m in exclude.split(",")]

        best_models = exp.compare_models(**params)
        
        # Get comparison results
        results_df = exp.pull()
        leaderboard = json.loads(results_df.to_json(orient="records", default_handler=str))

        # Store best models
        if not isinstance(best_models, list):
            best_models = [best_models]
        sessions[session_id]["best_models"] = best_models
        sessions[session_id]["best_model"] = best_models[0]

        # Get model names
        model_names = []
        for m in best_models:
            model_names.append(str(type(m).__name__))

        return {
            "session_id": session_id,
            "leaderboard": leaderboard,
            "best_model": model_names[0] if model_names else None,
            "top_models": model_names,
            "n_models_compared": len(leaderboard),
            "status": "compare_complete",
        }

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/automl/tune_model")
async def tune_model(
    session_id: str = Form(...),
    optimize: Optional[str] = Form(None),
    n_iter: int = Form(10),
    search_library: str = Form("optuna"),
    early_stopping: bool = Form(False),
):
    """Tune the best model hyperparameters."""
    try:
        if session_id not in sessions or "best_model" not in sessions[session_id]:
            raise HTTPException(status_code=404, detail="No model to tune. Run compare_models first.")

        exp = sessions[session_id]["experiment"]
        model = sessions[session_id]["best_model"]

        params = {"estimator": model, "n_iter": n_iter, "verbose": False}
        if optimize:
            params["optimize"] = optimize
        
        try:
            params["search_library"] = search_library
            tuned_model = exp.tune_model(**params)
        except Exception:
            # Fallback without search_library
            del params["search_library"]
            tuned_model = exp.tune_model(**params)

        tuned_results = exp.pull()
        
        sessions[session_id]["tuned_model"] = tuned_model
        sessions[session_id]["best_model"] = tuned_model

        return {
            "session_id": session_id,
            "tuned_model": str(type(tuned_model).__name__),
            "tuning_results": json.loads(tuned_results.to_json(orient="records", default_handler=str)),
            "status": "tune_complete",
        }

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/automl/ensemble_model")
async def ensemble_model(
    session_id: str = Form(...),
    method: str = Form("Bagging"),
    n_estimators: int = Form(10),
):
    """Create an ensemble of the best model."""
    try:
        if session_id not in sessions or "best_model" not in sessions[session_id]:
            raise HTTPException(status_code=404, detail="No model to ensemble. Run compare_models first.")

        exp = sessions[session_id]["experiment"]
        model = sessions[session_id]["best_model"]

        ensembled = exp.ensemble_model(model, method=method, n_estimators=n_estimators, verbose=False)
        results = exp.pull()

        sessions[session_id]["ensembled_model"] = ensembled
        sessions[session_id]["best_model"] = ensembled

        return {
            "session_id": session_id,
            "ensemble_method": method,
            "n_estimators": n_estimators,
            "results": json.loads(results.to_json(orient="records", default_handler=str)),
            "model": str(type(ensembled).__name__),
            "status": "ensemble_complete",
        }

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/automl/blend_models")
async def blend_models(
    session_id: str = Form(...),
    method: str = Form("soft"),
    n_top: int = Form(3),
):
    """Blend top N models."""
    try:
        if session_id not in sessions or "best_models" not in sessions[session_id]:
            raise HTTPException(status_code=404, detail="No models to blend. Run compare_models first.")

        exp = sessions[session_id]["experiment"]
        top_models = sessions[session_id]["best_models"][:n_top]

        task_type = sessions[session_id]["task_type"]
        if task_type == "classification":
            blended = exp.blend_models(estimator_list=top_models, method=method, verbose=False)
        else:
            blended = exp.blend_models(estimator_list=top_models, verbose=False)
        
        results = exp.pull()

        sessions[session_id]["blended_model"] = blended
        sessions[session_id]["best_model"] = blended

        return {
            "session_id": session_id,
            "blended_models": [str(type(m).__name__) for m in top_models],
            "results": json.loads(results.to_json(orient="records", default_handler=str)),
            "status": "blend_complete",
        }

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/automl/stack_models")
async def stack_models(
    session_id: str = Form(...),
    n_top: int = Form(3),
    restack: bool = Form(True),
):
    """Stack top N models."""
    try:
        if session_id not in sessions or "best_models" not in sessions[session_id]:
            raise HTTPException(status_code=404, detail="No models to stack. Run compare_models first.")

        exp = sessions[session_id]["experiment"]
        top_models = sessions[session_id]["best_models"][:n_top]

        stacked = exp.stack_models(estimator_list=top_models, restack=restack, verbose=False)
        results = exp.pull()

        sessions[session_id]["stacked_model"] = stacked
        sessions[session_id]["best_model"] = stacked

        return {
            "session_id": session_id,
            "stacked_models": [str(type(m).__name__) for m in top_models],
            "results": json.loads(results.to_json(orient="records", default_handler=str)),
            "restack": restack,
            "status": "stack_complete",
        }

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/automl/calibrate_model")
async def calibrate_model(
    session_id: str = Form(...),
    method: str = Form("sigmoid"),
):
    """Calibrate model probabilities (classification only)."""
    try:
        if session_id not in sessions or "best_model" not in sessions[session_id]:
            raise HTTPException(status_code=404, detail="No model to calibrate.")

        if sessions[session_id]["task_type"] != "classification":
            raise HTTPException(status_code=400, detail="Calibration only available for classification")

        exp = sessions[session_id]["experiment"]
        model = sessions[session_id]["best_model"]

        calibrated = exp.calibrate_model(model, method=method, verbose=False)
        results = exp.pull()

        sessions[session_id]["calibrated_model"] = calibrated
        sessions[session_id]["best_model"] = calibrated

        return {
            "session_id": session_id,
            "calibration_method": method,
            "results": json.loads(results.to_json(orient="records", default_handler=str)),
            "status": "calibrate_complete",
        }

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/automl/plot_model")
async def plot_model(
    session_id: str = Form(...),
    plot_type: Optional[str] = Form(None),
):
    """Generate analysis plots for the model."""
    try:
        if session_id not in sessions or "experiment" not in sessions[session_id]:
            raise HTTPException(status_code=404, detail="No active experiment.")

        exp = sessions[session_id]["experiment"]
        task_type = sessions[session_id]["task_type"]
        model = sessions[session_id].get("best_model")

        plots = []

        if task_type == "classification":
            plot_types = plot_type.split(",") if plot_type else [
                "auc", "confusion_matrix", "pr", "feature", "learning",
                "class_report", "boundary", "calibration", "lift", "gain",
                "ks"
            ]
            for pt in plot_types:
                pt = pt.strip()
                try:
                    plot_path = PLOT_DIR / f"{session_id}_{pt}.png"
                    exp.plot_model(model, plot=pt, save=str(PLOT_DIR), verbose=False)
                    # Find the saved plot
                    import glob
                    saved_files = sorted(glob.glob(str(PLOT_DIR / "*.png")), key=os.path.getmtime, reverse=True)
                    if saved_files:
                        with open(saved_files[0], "rb") as f:
                            b64 = base64.b64encode(f.read()).decode("utf-8")
                        plots.append({"type": pt, "image": b64})
                        os.remove(saved_files[0])
                except Exception as e:
                    plots.append({"type": pt, "error": str(e)})

        elif task_type == "regression":
            plot_types = plot_type.split(",") if plot_type else [
                "residuals", "error", "cooks", "feature", "learning",
                "vc", "manifold"
            ]
            for pt in plot_types:
                pt = pt.strip()
                try:
                    exp.plot_model(model, plot=pt, save=str(PLOT_DIR), verbose=False)
                    import glob
                    saved_files = sorted(glob.glob(str(PLOT_DIR / "*.png")), key=os.path.getmtime, reverse=True)
                    if saved_files:
                        with open(saved_files[0], "rb") as f:
                            b64 = base64.b64encode(f.read()).decode("utf-8")
                        plots.append({"type": pt, "image": b64})
                        os.remove(saved_files[0])
                except Exception as e:
                    plots.append({"type": pt, "error": str(e)})

        elif task_type == "clustering":
            plot_types = plot_type.split(",") if plot_type else ["cluster", "tsne", "elbow", "silhouette", "distribution"]
            for pt in plot_types:
                pt = pt.strip()
                try:
                    exp.plot_model(model, plot=pt, save=str(PLOT_DIR), verbose=False)
                    import glob
                    saved_files = sorted(glob.glob(str(PLOT_DIR / "*.png")), key=os.path.getmtime, reverse=True)
                    if saved_files:
                        with open(saved_files[0], "rb") as f:
                            b64 = base64.b64encode(f.read()).decode("utf-8")
                        plots.append({"type": pt, "image": b64})
                        os.remove(saved_files[0])
                except Exception as e:
                    plots.append({"type": pt, "error": str(e)})

        elif task_type == "anomaly_detection":
            plot_types = plot_type.split(",") if plot_type else ["tsne", "umap"]
            for pt in plot_types:
                pt = pt.strip()
                try:
                    exp.plot_model(model, plot=pt, save=str(PLOT_DIR), verbose=False)
                    import glob
                    saved_files = sorted(glob.glob(str(PLOT_DIR / "*.png")), key=os.path.getmtime, reverse=True)
                    if saved_files:
                        with open(saved_files[0], "rb") as f:
                            b64 = base64.b64encode(f.read()).decode("utf-8")
                        plots.append({"type": pt, "image": b64})
                        os.remove(saved_files[0])
                except Exception as e:
                    plots.append({"type": pt, "error": str(e)})

        elif task_type == "time_series":
            plot_types = plot_type.split(",") if plot_type else ["forecast", "diagnostics", "decomp"]
            for pt in plot_types:
                pt = pt.strip()
                try:
                    exp.plot_model(model, plot=pt, save=str(PLOT_DIR), verbose=False)
                    import glob
                    saved_files = sorted(glob.glob(str(PLOT_DIR / "*.png")), key=os.path.getmtime, reverse=True)
                    if saved_files:
                        with open(saved_files[0], "rb") as f:
                            b64 = base64.b64encode(f.read()).decode("utf-8")
                        plots.append({"type": pt, "image": b64})
                        os.remove(saved_files[0])
                except Exception as e:
                    plots.append({"type": pt, "error": str(e)})

        return {
            "session_id": session_id,
            "plots": plots,
            "status": "plots_generated",
        }

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/automl/interpret_model")
async def interpret_model(
    session_id: str = Form(...),
):
    """Generate model interpretation (SHAP, feature importance)."""
    try:
        if session_id not in sessions or "best_model" not in sessions[session_id]:
            raise HTTPException(status_code=404, detail="No model to interpret.")

        exp = sessions[session_id]["experiment"]
        model = sessions[session_id]["best_model"]
        task_type = sessions[session_id]["task_type"]

        interpretations = []

        if task_type in ["classification", "regression"]:
            # Feature importance
            try:
                exp.plot_model(model, plot="feature", save=str(PLOT_DIR), verbose=False)
                import glob
                saved_files = sorted(glob.glob(str(PLOT_DIR / "*.png")), key=os.path.getmtime, reverse=True)
                if saved_files:
                    with open(saved_files[0], "rb") as f:
                        b64 = base64.b64encode(f.read()).decode("utf-8")
                    interpretations.append({"type": "feature_importance", "image": b64, "title": "Feature Importance"})
                    os.remove(saved_files[0])
            except Exception as e:
                interpretations.append({"type": "feature_importance", "error": str(e)})

            # SHAP summary
            try:
                interpret_plots = ["summary", "correlation"]
                for ip in interpret_plots:
                    try:
                        exp.interpret_model(model, plot=ip, save=str(PLOT_DIR))
                        import glob
                        saved_files = sorted(glob.glob(str(PLOT_DIR / "*.png")), key=os.path.getmtime, reverse=True)
                        if saved_files:
                            with open(saved_files[0], "rb") as f:
                                b64 = base64.b64encode(f.read()).decode("utf-8")
                            interpretations.append({"type": f"shap_{ip}", "image": b64, "title": f"SHAP {ip.title()} Plot"})
                            os.remove(saved_files[0])
                    except Exception:
                        pass
            except Exception:
                pass

            # Learning curve
            try:
                exp.plot_model(model, plot="learning", save=str(PLOT_DIR), verbose=False)
                import glob
                saved_files = sorted(glob.glob(str(PLOT_DIR / "*.png")), key=os.path.getmtime, reverse=True)
                if saved_files:
                    with open(saved_files[0], "rb") as f:
                        b64 = base64.b64encode(f.read()).decode("utf-8")
                    interpretations.append({"type": "learning_curve", "image": b64, "title": "Learning Curve"})
                    os.remove(saved_files[0])
            except Exception:
                pass

        return {
            "session_id": session_id,
            "interpretations": interpretations,
            "status": "interpretation_complete",
        }

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/automl/predict")
async def predict(
    session_id: str = Form(...),
    data_csv: Optional[str] = Form(None),
):
    """Generate predictions on test set or new data."""
    try:
        if session_id not in sessions or "best_model" not in sessions[session_id]:
            raise HTTPException(status_code=404, detail="No model for prediction.")

        exp = sessions[session_id]["experiment"]
        model = sessions[session_id]["best_model"]
        task_type = sessions[session_id]["task_type"]

        if data_csv:
            new_data = pd.read_csv(io.StringIO(data_csv))
            predictions = exp.predict_model(model, data=new_data)
        else:
            predictions = exp.predict_model(model)

        # Get metrics
        try:
            metrics = exp.pull()
            metrics_data = json.loads(metrics.to_json(orient="records", default_handler=str))
        except Exception:
            metrics_data = []

        # Return predictions preview
        pred_preview = json.loads(predictions.head(50).to_json(orient="records", default_handler=str))

        result = {
            "session_id": session_id,
            "predictions_preview": pred_preview,
            "total_predictions": len(predictions),
            "metrics": metrics_data,
            "status": "prediction_complete",
        }

        # Add prediction distribution info
        if task_type == "classification":
            pred_col = "prediction_label"
            if pred_col in predictions.columns:
                dist = predictions[pred_col].value_counts().to_dict()
                result["prediction_distribution"] = {str(k): int(v) for k, v in dist.items()}

        return result

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/automl/create_model")
async def create_model(
    session_id: str = Form(...),
    model_id: Optional[str] = Form(None),
    num_clusters: int = Form(4),
    fraction: float = Form(0.05),
):
    """Create a model (for clustering and anomaly detection)."""
    try:
        if session_id not in sessions or "experiment" not in sessions[session_id]:
            raise HTTPException(status_code=404, detail="No active experiment.")

        exp = sessions[session_id]["experiment"]
        task_type = sessions[session_id]["task_type"]

        if task_type == "clustering":
            model_name = model_id or "kmeans"
            model = exp.create_model(model_name, num_clusters=num_clusters, verbose=False)
            results = exp.pull()
            
            sessions[session_id]["best_model"] = model
            
            return {
                "session_id": session_id,
                "model": model_name,
                "results": safe_serialize(results),
                "status": "model_created",
            }

        elif task_type == "anomaly_detection":
            model_name = model_id or "iforest"
            model = exp.create_model(model_name, fraction=fraction, verbose=False)
            results = exp.pull()
            
            sessions[session_id]["best_model"] = model
            
            return {
                "session_id": session_id,
                "model": model_name,
                "results": safe_serialize(results),
                "status": "model_created",
            }

        else:
            raise HTTPException(status_code=400, detail="create_model only for clustering/anomaly detection")

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/automl/assign_model")
async def assign_model(
    session_id: str = Form(...),
):
    """Assign cluster/anomaly labels to data."""
    try:
        if session_id not in sessions or "best_model" not in sessions[session_id]:
            raise HTTPException(status_code=404, detail="No model found.")

        exp = sessions[session_id]["experiment"]
        model = sessions[session_id]["best_model"]
        task_type = sessions[session_id]["task_type"]

        assigned = exp.assign_model(model)
        preview = json.loads(assigned.head(50).to_json(orient="records", default_handler=str))

        result = {
            "session_id": session_id,
            "assigned_preview": preview,
            "total_rows": len(assigned),
            "status": "assign_complete",
        }

        if task_type == "clustering":
            cluster_col = "Cluster"
            if cluster_col in assigned.columns:
                dist = assigned[cluster_col].value_counts().to_dict()
                result["cluster_distribution"] = {str(k): int(v) for k, v in dist.items()}

        elif task_type == "anomaly_detection":
            anomaly_col = "Anomaly"
            if anomaly_col in assigned.columns:
                dist = assigned[anomaly_col].value_counts().to_dict()
                result["anomaly_distribution"] = {str(k): int(v) for k, v in dist.items()}
                result["anomaly_count"] = int(assigned[anomaly_col].sum())
                result["anomaly_percentage"] = round(assigned[anomaly_col].mean() * 100, 2)

        return result

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/automl/finalize_model")
async def finalize_model(
    session_id: str = Form(...),
):
    """Finalize the model (train on full dataset)."""
    try:
        if session_id not in sessions or "best_model" not in sessions[session_id]:
            raise HTTPException(status_code=404, detail="No model to finalize.")

        exp = sessions[session_id]["experiment"]
        model = sessions[session_id]["best_model"]

        finalized = exp.finalize_model(model)
        sessions[session_id]["finalized_model"] = finalized
        sessions[session_id]["best_model"] = finalized

        return {
            "session_id": session_id,
            "model": str(type(finalized).__name__),
            "status": "finalize_complete",
            "message": "Model trained on full dataset and ready for production.",
        }

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/automl/save_model")
async def save_model(
    session_id: str = Form(...),
    model_name: str = Form("automl_model"),
):
    """Save the model pipeline."""
    try:
        if session_id not in sessions or "best_model" not in sessions[session_id]:
            raise HTTPException(status_code=404, detail="No model to save.")

        exp = sessions[session_id]["experiment"]
        model = sessions[session_id]["best_model"]

        save_path = MODEL_DIR / f"{session_id}_{model_name}"
        exp.save_model(model, str(save_path))

        return {
            "session_id": session_id,
            "model_path": str(save_path),
            "status": "save_complete",
            "message": f"Model saved as {model_name}",
        }

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/automl/get_leaderboard")
async def get_leaderboard(
    session_id: str = Form(...),
):
    """Get available models for the task type."""
    try:
        if session_id not in sessions or "experiment" not in sessions[session_id]:
            raise HTTPException(status_code=404, detail="No active experiment.")

        exp = sessions[session_id]["experiment"]
        task_type = sessions[session_id]["task_type"]

        try:
            models = exp.models()
            models_data = json.loads(models.to_json(orient="records", default_handler=str))
        except Exception:
            models_data = []

        return {
            "session_id": session_id,
            "task_type": task_type,
            "available_models": models_data,
            "status": "leaderboard_ready",
        }

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/automl/full_pipeline")
async def full_pipeline(
    session_id: str = Form(...),
    task_type: str = Form(...),
    target: Optional[str] = Form(None),
    train_size: float = Form(0.7),
    n_top: int = Form(3),
    optimize: Optional[str] = Form(None),
    normalize: bool = Form(False),
    feature_selection: bool = Form(False),
    remove_outliers: bool = Form(False),
    fix_imbalance: bool = Form(False),
    fold: int = Form(10),
    n_clusters: int = Form(4),
    anomaly_fraction: float = Form(0.05),
    fh: int = Form(12),
    seasonal_period: Optional[int] = Form(None),
):
    """Run the FULL AutoML pipeline end-to-end in one call."""
    try:
        if session_id not in sessions:
            raise HTTPException(status_code=404, detail="Session not found.")

        df = sessions[session_id]["df"].copy()
        pipeline_results = {"steps": [], "plots": [], "metrics": {}}

        # ===== STEP 1: SETUP =====
        if task_type == "classification":
            from pycaret.classification import ClassificationExperiment
            exp = ClassificationExperiment()
            if not target:
                raise HTTPException(status_code=400, detail="Target required for classification")
            exp.setup(data=df, target=target, session_id=123, train_size=train_size,
                     normalize=normalize, feature_selection=feature_selection,
                     remove_outliers=remove_outliers, fix_imbalance=fix_imbalance,
                     fold=fold, html=False, verbose=False)
            pipeline_results["steps"].append({"step": "Setup", "status": "complete",
                "detail": f"Classification setup done. Target: {target}, Shape: {df.shape}"})

        elif task_type == "regression":
            from pycaret.regression import RegressionExperiment
            exp = RegressionExperiment()
            if not target:
                raise HTTPException(status_code=400, detail="Target required for regression")
            exp.setup(data=df, target=target, session_id=123, train_size=train_size,
                     normalize=normalize, feature_selection=feature_selection,
                     remove_outliers=remove_outliers, fold=fold,
                     html=False, verbose=False)
            pipeline_results["steps"].append({"step": "Setup", "status": "complete",
                "detail": f"Regression setup done. Target: {target}, Shape: {df.shape}"})

        elif task_type == "clustering":
            from pycaret.clustering import ClusteringExperiment
            exp = ClusteringExperiment()
            exp.setup(data=df, session_id=123, normalize=normalize, html=False, verbose=False)
            pipeline_results["steps"].append({"step": "Setup", "status": "complete",
                "detail": f"Clustering setup done. Shape: {df.shape}"})

            # Create model
            model = exp.create_model("kmeans", num_clusters=n_clusters, verbose=False)
            pipeline_results["steps"].append({"step": "Create Model", "status": "complete",
                "detail": f"KMeans with {n_clusters} clusters created"})

            # Assign
            assigned = exp.assign_model(model)
            dist = assigned["Cluster"].value_counts().to_dict()
            pipeline_results["steps"].append({"step": "Assign Labels", "status": "complete",
                "detail": f"Cluster distribution: {dict(dist)}"})

            # Plots
            for pt in ["cluster", "tsne", "elbow", "silhouette", "distribution"]:
                try:
                    exp.plot_model(model, plot=pt, save=str(PLOT_DIR), verbose=False)
                    import glob
                    saved_files = sorted(glob.glob(str(PLOT_DIR / "*.png")), key=os.path.getmtime, reverse=True)
                    if saved_files:
                        with open(saved_files[0], "rb") as f:
                            b64 = base64.b64encode(f.read()).decode("utf-8")
                        pipeline_results["plots"].append({"type": pt, "image": b64})
                        os.remove(saved_files[0])
                except Exception:
                    pass

            sessions[session_id]["experiment"] = exp
            sessions[session_id]["best_model"] = model
            sessions[session_id]["task_type"] = task_type

            return {"session_id": session_id, **pipeline_results, "status": "pipeline_complete"}

        elif task_type == "anomaly_detection":
            from pycaret.anomaly import AnomalyExperiment
            exp = AnomalyExperiment()
            exp.setup(data=df, session_id=123, normalize=normalize, html=False, verbose=False)
            pipeline_results["steps"].append({"step": "Setup", "status": "complete",
                "detail": f"Anomaly Detection setup done. Shape: {df.shape}"})

            model = exp.create_model("iforest", fraction=anomaly_fraction, verbose=False)
            pipeline_results["steps"].append({"step": "Create Model", "status": "complete",
                "detail": f"Isolation Forest created. Anomaly fraction: {anomaly_fraction}"})

            assigned = exp.assign_model(model)
            anom_count = int(assigned["Anomaly"].sum())
            pipeline_results["steps"].append({"step": "Detect Anomalies", "status": "complete",
                "detail": f"Detected {anom_count} anomalies ({round(anom_count/len(assigned)*100, 1)}%)"})

            for pt in ["tsne", "umap"]:
                try:
                    exp.plot_model(model, plot=pt, save=str(PLOT_DIR), verbose=False)
                    import glob
                    saved_files = sorted(glob.glob(str(PLOT_DIR / "*.png")), key=os.path.getmtime, reverse=True)
                    if saved_files:
                        with open(saved_files[0], "rb") as f:
                            b64 = base64.b64encode(f.read()).decode("utf-8")
                        pipeline_results["plots"].append({"type": pt, "image": b64})
                        os.remove(saved_files[0])
                except Exception:
                    pass

            sessions[session_id]["experiment"] = exp
            sessions[session_id]["best_model"] = model
            sessions[session_id]["task_type"] = task_type

            return {"session_id": session_id, **pipeline_results, "status": "pipeline_complete"}

        elif task_type == "time_series":
            from pycaret.time_series import TSForecastingExperiment
            exp = TSForecastingExperiment()
            if not target:
                raise HTTPException(status_code=400, detail="Target required for time series")
            
            setup_params = dict(data=df, target=target, session_id=123, fh=fh, html=False, verbose=False)
            if seasonal_period:
                setup_params["seasonal_period"] = seasonal_period
            exp.setup(**setup_params)
            pipeline_results["steps"].append({"step": "Setup", "status": "complete",
                "detail": f"Time Series setup done. Target: {target}, FH: {fh}"})

            best = exp.compare_models(n_select=n_top, verbose=False)
            results_df = exp.pull()
            pipeline_results["steps"].append({"step": "Compare Models", "status": "complete",
                "detail": f"Compared models. Best: {type(best[0] if isinstance(best, list) else best).__name__}",
                "leaderboard": json.loads(results_df.to_json(orient="records", default_handler=str))})

            best_model = best[0] if isinstance(best, list) else best
            sessions[session_id]["experiment"] = exp
            sessions[session_id]["best_model"] = best_model
            sessions[session_id]["best_models"] = best if isinstance(best, list) else [best]
            sessions[session_id]["task_type"] = task_type

            # Predictions
            preds = exp.predict_model(best_model)
            pipeline_results["steps"].append({"step": "Forecast", "status": "complete",
                "predictions": json.loads(preds.to_json(orient="records", default_handler=str))})

            return {"session_id": session_id, **pipeline_results, "status": "pipeline_complete"}
        else:
            raise HTTPException(status_code=400, detail=f"Unknown task: {task_type}")

        # ===== STEPS 2-7 for classification/regression =====
        # STEP 2: Compare Models
        best_models = exp.compare_models(n_select=n_top, verbose=False)
        results_df = exp.pull()
        leaderboard = json.loads(results_df.to_json(orient="records", default_handler=str))
        
        if not isinstance(best_models, list):
            best_models = [best_models]
        
        best_model = best_models[0]
        pipeline_results["steps"].append({
            "step": "Compare Models", "status": "complete",
            "detail": f"Compared all models. Best: {type(best_model).__name__}",
            "leaderboard": leaderboard
        })

        # STEP 3: Tune Best Model
        try:
            tuned = exp.tune_model(best_model, n_iter=10, verbose=False)
            tuned_results = exp.pull()
            pipeline_results["steps"].append({
                "step": "Tune Model", "status": "complete",
                "detail": f"Tuned {type(best_model).__name__}",
                "results": json.loads(tuned_results.to_json(orient="records", default_handler=str))
            })
            best_model = tuned
        except Exception as e:
            pipeline_results["steps"].append({"step": "Tune Model", "status": "skipped", "detail": str(e)})

        # STEP 4: Ensemble
        try:
            ensembled = exp.ensemble_model(best_model, verbose=False)
            ens_results = exp.pull()
            pipeline_results["steps"].append({
                "step": "Ensemble Model", "status": "complete",
                "results": json.loads(ens_results.to_json(orient="records", default_handler=str))
            })
        except Exception as e:
            pipeline_results["steps"].append({"step": "Ensemble Model", "status": "skipped", "detail": str(e)})

        # STEP 5: Blend
        try:
            if task_type == "classification":
                blended = exp.blend_models(estimator_list=best_models[:n_top], method="soft", verbose=False)
            else:
                blended = exp.blend_models(estimator_list=best_models[:n_top], verbose=False)
            blend_results = exp.pull()
            pipeline_results["steps"].append({
                "step": "Blend Models", "status": "complete",
                "results": json.loads(blend_results.to_json(orient="records", default_handler=str))
            })
        except Exception as e:
            pipeline_results["steps"].append({"step": "Blend Models", "status": "skipped", "detail": str(e)})

        # STEP 6: Stack
        try:
            stacked = exp.stack_models(estimator_list=best_models[:n_top], verbose=False)
            stack_results = exp.pull()
            pipeline_results["steps"].append({
                "step": "Stack Models", "status": "complete",
                "results": json.loads(stack_results.to_json(orient="records", default_handler=str))
            })
        except Exception as e:
            pipeline_results["steps"].append({"step": "Stack Models", "status": "skipped", "detail": str(e)})

        # STEP 7: Predictions
        predictions = exp.predict_model(best_model)
        pred_metrics = exp.pull()
        pipeline_results["steps"].append({
            "step": "Predictions", "status": "complete",
            "metrics": json.loads(pred_metrics.to_json(orient="records", default_handler=str)),
            "predictions_preview": json.loads(predictions.head(20).to_json(orient="records", default_handler=str)),
        })

        # STEP 8: Plots
        if task_type == "classification":
            plot_list = ["auc", "confusion_matrix", "pr", "feature", "learning", "class_report", "calibration"]
        else:
            plot_list = ["residuals", "error", "cooks", "feature", "learning"]

        for pt in plot_list:
            try:
                exp.plot_model(best_model, plot=pt, save=str(PLOT_DIR), verbose=False)
                import glob
                saved_files = sorted(glob.glob(str(PLOT_DIR / "*.png")), key=os.path.getmtime, reverse=True)
                if saved_files:
                    with open(saved_files[0], "rb") as f:
                        b64 = base64.b64encode(f.read()).decode("utf-8")
                    pipeline_results["plots"].append({"type": pt, "image": b64})
                    os.remove(saved_files[0])
            except Exception:
                pass

        # STEP 9: Interpretation
        try:
            exp.interpret_model(best_model, plot="summary", save=str(PLOT_DIR))
            import glob
            saved_files = sorted(glob.glob(str(PLOT_DIR / "*.png")), key=os.path.getmtime, reverse=True)
            if saved_files:
                with open(saved_files[0], "rb") as f:
                    b64 = base64.b64encode(f.read()).decode("utf-8")
                pipeline_results["plots"].append({"type": "shap_summary", "image": b64})
                os.remove(saved_files[0])
        except Exception:
            pass

        # Store
        sessions[session_id]["experiment"] = exp
        sessions[session_id]["best_model"] = best_model
        sessions[session_id]["best_models"] = best_models
        sessions[session_id]["task_type"] = task_type
        sessions[session_id]["target"] = target

        # Finalize
        try:
            finalized = exp.finalize_model(best_model)
            pipeline_results["steps"].append({"step": "Finalize Model", "status": "complete",
                "detail": "Model trained on full dataset, ready for production."})
            sessions[session_id]["best_model"] = finalized
        except Exception:
            pass

        # Save
        try:
            save_path = MODEL_DIR / f"{session_id}_final_model"
            exp.save_model(sessions[session_id]["best_model"], str(save_path))
            pipeline_results["steps"].append({"step": "Save Model", "status": "complete",
                "detail": f"Model saved to {save_path}"})
        except Exception:
            pass

        return {
            "session_id": session_id,
            **pipeline_results,
            "status": "pipeline_complete",
        }

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/automl/models/{task_type}")
async def get_available_models(task_type: str):
    """Get all available model IDs for a task type."""
    models_map = {
        "classification": [
            {"id": "lr", "name": "Logistic Regression"},
            {"id": "knn", "name": "K Neighbors Classifier"},
            {"id": "nb", "name": "Naive Bayes"},
            {"id": "dt", "name": "Decision Tree Classifier"},
            {"id": "svm", "name": "SVM - Linear Kernel"},
            {"id": "rbfsvm", "name": "SVM - Radial Kernel"},
            {"id": "gpc", "name": "Gaussian Process Classifier"},
            {"id": "mlp", "name": "MLP Classifier"},
            {"id": "ridge", "name": "Ridge Classifier"},
            {"id": "rf", "name": "Random Forest Classifier"},
            {"id": "qda", "name": "Quadratic Discriminant Analysis"},
            {"id": "ada", "name": "Ada Boost Classifier"},
            {"id": "gbc", "name": "Gradient Boosting Classifier"},
            {"id": "lda", "name": "Linear Discriminant Analysis"},
            {"id": "et", "name": "Extra Trees Classifier"},
            {"id": "xgboost", "name": "Extreme Gradient Boosting"},
            {"id": "lightgbm", "name": "Light Gradient Boosting"},
            {"id": "catboost", "name": "CatBoost Classifier"},
            {"id": "dummy", "name": "Dummy Classifier"},
        ],
        "regression": [
            {"id": "lr", "name": "Linear Regression"},
            {"id": "lasso", "name": "Lasso Regression"},
            {"id": "ridge", "name": "Ridge Regression"},
            {"id": "en", "name": "Elastic Net"},
            {"id": "lar", "name": "Least Angle Regression"},
            {"id": "llar", "name": "Lasso Least Angle Regression"},
            {"id": "omp", "name": "Orthogonal Matching Pursuit"},
            {"id": "br", "name": "Bayesian Ridge"},
            {"id": "ard", "name": "Automatic Relevance Determination"},
            {"id": "par", "name": "Passive Aggressive Regressor"},
            {"id": "ransac", "name": "Random Sample Consensus"},
            {"id": "tr", "name": "TheilSen Regressor"},
            {"id": "huber", "name": "Huber Regressor"},
            {"id": "kr", "name": "Kernel Ridge"},
            {"id": "svm", "name": "Support Vector Regression"},
            {"id": "knn", "name": "K Neighbors Regressor"},
            {"id": "dt", "name": "Decision Tree Regressor"},
            {"id": "rf", "name": "Random Forest Regressor"},
            {"id": "et", "name": "Extra Trees Regressor"},
            {"id": "ada", "name": "AdaBoost Regressor"},
            {"id": "gbr", "name": "Gradient Boosting Regressor"},
            {"id": "mlp", "name": "MLP Regressor"},
            {"id": "xgboost", "name": "Extreme Gradient Boosting"},
            {"id": "lightgbm", "name": "Light Gradient Boosting"},
            {"id": "catboost", "name": "CatBoost Regressor"},
            {"id": "dummy", "name": "Dummy Regressor"},
        ],
        "clustering": [
            {"id": "kmeans", "name": "K-Means Clustering"},
            {"id": "ap", "name": "Affinity Propagation"},
            {"id": "meanshift", "name": "Mean Shift Clustering"},
            {"id": "sc", "name": "Spectral Clustering"},
            {"id": "hclust", "name": "Agglomerative Clustering"},
            {"id": "dbscan", "name": "DBSCAN"},
            {"id": "optics", "name": "OPTICS Clustering"},
            {"id": "birch", "name": "Birch Clustering"},
            {"id": "kmodes", "name": "K-Modes Clustering"},
        ],
        "anomaly_detection": [
            {"id": "abod", "name": "Angle-base Outlier Detection"},
            {"id": "cluster", "name": "Clustering-Based Local Outlier"},
            {"id": "cof", "name": "Connectivity-Based Outlier Factor"},
            {"id": "iforest", "name": "Isolation Forest"},
            {"id": "histogram", "name": "Histogram-based Outlier Detection"},
            {"id": "knn", "name": "K-Nearest Neighbors Detector"},
            {"id": "lof", "name": "Local Outlier Factor"},
            {"id": "svm", "name": "One-class SVM detector"},
            {"id": "pca", "name": "Principal Component Analysis"},
            {"id": "mcd", "name": "Minimum Covariance Determinant"},
            {"id": "sod", "name": "Subspace Outlier Detection"},
            {"id": "sos", "name": "Stochastic Outlier Selection"},
        ],
    }
    
    return {"task_type": task_type, "models": models_map.get(task_type, [])}


@app.post("/automl/dashboard_data")
async def get_dashboard_data(
    session_id: str = Form(...),
):
    """Get comprehensive data for the AutoML dashboard."""
    try:
        if session_id not in sessions:
            raise HTTPException(status_code=404, detail="Session not found.")

        df = sessions[session_id]["df"]
        
        # Data quality report
        quality = {
            "total_rows": len(df),
            "total_columns": len(df.columns),
            "missing_cells": int(df.isnull().sum().sum()),
            "missing_percentage": round(df.isnull().sum().sum() / (len(df) * len(df.columns)) * 100, 2),
            "duplicate_rows": int(df.duplicated().sum()),
            "memory_usage": f"{df.memory_usage(deep=True).sum() / 1024:.1f} KB",
        }

        # Column-level analysis
        columns = []
        for col in df.columns:
            col_data = {
                "name": col,
                "dtype": str(df[col].dtype),
                "missing": int(df[col].isnull().sum()),
                "missing_pct": round(df[col].isnull().mean() * 100, 2),
                "unique": int(df[col].nunique()),
                "unique_pct": round(df[col].nunique() / len(df) * 100, 2),
            }
            if pd.api.types.is_numeric_dtype(df[col]):
                desc = df[col].describe()
                col_data.update({
                    "type": "numeric",
                    "mean": safe_serialize(desc["mean"]),
                    "std": safe_serialize(desc["std"]),
                    "min": safe_serialize(desc["min"]),
                    "q25": safe_serialize(desc["25%"]),
                    "median": safe_serialize(desc["50%"]),
                    "q75": safe_serialize(desc["75%"]),
                    "max": safe_serialize(desc["max"]),
                    "skew": safe_serialize(df[col].skew()),
                    "kurtosis": safe_serialize(df[col].kurtosis()),
                })
            else:
                col_data["type"] = "categorical"
                top = df[col].value_counts().head(5)
                col_data["top_values"] = {str(k): int(v) for k, v in top.items()}

            columns.append(col_data)

        # Correlations for numeric columns
        numeric_df = df.select_dtypes(include=[np.number])
        correlations = {}
        if len(numeric_df.columns) > 1:
            corr_matrix = numeric_df.corr()
            correlations = json.loads(corr_matrix.to_json(default_handler=str))

        return {
            "session_id": session_id,
            "quality": quality,
            "columns": columns,
            "correlations": correlations,
            "preview": json.loads(df.head(10).to_json(orient="records", default_handler=str)),
        }

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
