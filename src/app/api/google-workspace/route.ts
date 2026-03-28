import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Google Workspace integration endpoint
// Handles Gmail, Calendar, Tasks, and Meet data fetching
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { type } = await req.json();

    // Check if user has Google workspace access token
    const accessToken = (session as { accessToken?: string }).accessToken;
    
    if (!accessToken) {
      return NextResponse.json({
        connected: false,
        message: "Google Workspace not connected. Please reconnect with workspace permissions.",
        type,
      });
    }

    switch (type) {
      case "gmail": {
        const response = await fetch(
          "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10&labelIds=INBOX",
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (!response.ok) return NextResponse.json({ connected: false, type });
        const data = await response.json();
        
        const emails = await Promise.all(
          (data.messages || []).slice(0, 5).map(async (msg: { id: string }) => {
            const msgRes = await fetch(
              `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`,
              { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            if (!msgRes.ok) return null;
            const msgData = await msgRes.json();
            const headers = msgData.payload?.headers || [];
            const subject = headers.find((h: { name: string }) => h.name === "Subject")?.value || "(No subject)";
            const from = headers.find((h: { name: string }) => h.name === "From")?.value || "";
            return {
              id: msg.id,
              subject,
              from,
              snippet: msgData.snippet || "",
              date: new Date(parseInt(msgData.internalDate)).toLocaleDateString(),
              unread: (msgData.labelIds || []).includes("UNREAD"),
            };
          })
        );

        return NextResponse.json({
          connected: true,
          type: "gmail",
          emails: emails.filter(Boolean),
        });
      }

      case "calendar": {
        const now = new Date().toISOString();
        const weekLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        const response = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now}&timeMax=${weekLater}&maxResults=10&singleEvents=true&orderBy=startTime`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (!response.ok) return NextResponse.json({ connected: false, type });
        const data = await response.json();

        const events = (data.items || []).map((event: { id: string; summary: string; start: { dateTime?: string; date?: string }; end: { dateTime?: string; date?: string }; location?: string; attendees?: { length: number } }) => ({
          id: event.id,
          title: event.summary || "(No title)",
          start: event.start?.dateTime || event.start?.date || "",
          end: event.end?.dateTime || event.end?.date || "",
          location: event.location,
          attendees: event.attendees?.length || 0,
        }));

        return NextResponse.json({ connected: true, type: "calendar", events });
      }

      case "tasks": {
        const response = await fetch(
          "https://tasks.googleapis.com/tasks/v1/users/@me/lists",
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (!response.ok) return NextResponse.json({ connected: false, type });
        const listsData = await response.json();
        const firstList = listsData.items?.[0];
        if (!firstList) return NextResponse.json({ connected: true, type: "tasks", tasks: [] });

        const tasksRes = await fetch(
          `https://tasks.googleapis.com/tasks/v1/lists/${firstList.id}/tasks?maxResults=20`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (!tasksRes.ok) return NextResponse.json({ connected: false, type });
        const tasksData = await tasksRes.json();

        const tasks = (tasksData.items || []).map((task: { id: string; title: string; due?: string; status: string; notes?: string }) => ({
          id: task.id,
          title: task.title,
          due: task.due ? new Date(task.due).toLocaleDateString() : undefined,
          completed: task.status === "completed",
          notes: task.notes,
        }));

        return NextResponse.json({ connected: true, type: "tasks", tasks });
      }

      case "meet": {
        // Meet doesn't have a direct API; we pull upcoming calendar events with Meet links
        const now = new Date().toISOString();
        const dayLater = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        const response = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now}&timeMax=${dayLater}&maxResults=10&singleEvents=true&orderBy=startTime`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (!response.ok) return NextResponse.json({ connected: false, type });
        const data = await response.json();

        const meetings = (data.items || [])
          .filter((event: { hangoutLink?: string; conferenceData?: unknown }) => event.hangoutLink || event.conferenceData)
          .map((event: { id: string; summary: string; start: { dateTime?: string }; hangoutLink?: string; attendees?: { length: number } }) => ({
            id: event.id,
            title: event.summary || "(No title)",
            time: event.start?.dateTime ? new Date(event.start.dateTime).toLocaleString() : "",
            link: event.hangoutLink || "",
            participants: event.attendees?.length || 0,
          }));

        return NextResponse.json({ connected: true, type: "meet", meetings });
      }

      default:
        return NextResponse.json({ error: "Unknown workspace type" }, { status: 400 });
    }
  } catch (error) {
    console.error("Google Workspace error:", error);
    return NextResponse.json({ error: "Failed to fetch workspace data" }, { status: 500 });
  }
}
