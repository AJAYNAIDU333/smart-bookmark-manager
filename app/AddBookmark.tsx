"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { RealtimeChannel } from "@supabase/supabase-js";

interface Bookmark {
  id: string;
  user_id: string;
  url: string;
  title: string;
  created_at: string;
}

interface AddBookmarkProps {
  user: { id: string; email: string };
}

export default function AddBookmark({ user }: AddBookmarkProps) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  const fetchBookmarks = async () => {
    const { data, error } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) console.error("Error fetching bookmarks:", error);
    else setBookmarks(data || []);
  };

  const addBookmark = async () => {
    if (!url || !title) return;
    const { data, error } = await supabase
      .from("bookmarks")
      .insert([{ url, title, user_id: user.id }])
      .select();

    if (error) return console.error(error);
    setUrl("");
    setTitle("");
    if (data && data.length > 0) {
      setBookmarks((prev) => [data[0] as Bookmark, ...prev]);
    }
  };

  const deleteBookmark = async (id: string) => {
    const { error } = await supabase.from("bookmarks").delete().eq("id", id);
    if (error) return console.error(error);
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  };

  useEffect(() => {
    fetchBookmarks();
    let channel: RealtimeChannel;
    const setupRealtimeSubscription = async () => {
      channel = supabase
        .channel(`bookmarks:${user.id}`)
        .on("postgres_changes", {
          event: "*",
          schema: "public",
          table: "bookmarks",
          filter: `user_id=eq.${user.id}`,
        }, (payload) => {
          if (payload.eventType === "INSERT") {
            setBookmarks((prev) => {
              const exists = prev.some((b) => b.id === payload.new.id);
              if (exists) return prev;
              return [payload.new as Bookmark, ...prev];
            });
          } else if (payload.eventType === "DELETE") {
            setBookmarks((prev) => prev.filter((b) => b.id !== payload.old.id));
          }
        }).subscribe();
    };
    setupRealtimeSubscription();
    return () => { if (channel) channel.unsubscribe(); };
  }, [user.id]);

  return (
    <div className="max-w-2xl mx-auto px-6">
      {/* Input Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-10 transition-all hover:shadow-md">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Save a new link</h2>
        <div className="flex flex-col gap-4">
          <input
            className="w-full border border-slate-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-slate-50 focus:bg-white text-slate-800"
            placeholder="What is the website called?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              className="flex-grow border border-slate-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-slate-50 focus:bg-white text-slate-800"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <button
              onClick={addBookmark}
              className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 active:scale-95 transition shadow-lg shadow-blue-200 whitespace-nowrap"
            >
              Add Bookmark
            </button>
          </div>
        </div>
      </div>

      {/* List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Your Collection</h2>
          <span className="text-xs font-bold bg-slate-200 text-slate-600 px-2.5 py-1 rounded-full">{bookmarks.length} Links</span>
        </div>
        
        {bookmarks.length === 0 ? (
          <div className="text-center py-20 bg-slate-100/50 rounded-2xl border-2 border-dashed border-slate-200">
            <p className="text-slate-400 font-medium italic">Empty list. Start by adding a URL above!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {bookmarks.map((b) => (
              <div
                key={b.id}
                className="group flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                <div className="overflow-hidden pr-4">
                  <h3 className="font-bold text-slate-800 text-lg group-hover:text-blue-600 transition-colors leading-tight mb-1 truncate">{b.title}</h3>
                  <a
                    href={b.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 text-sm hover:underline flex items-center gap-1 truncate"
                  >
                    {b.url}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
                
                <button
                  onClick={() => deleteBookmark(b.id)}
                  className="flex-shrink-0 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white p-3 rounded-xl transition-all duration-200 shadow-sm border border-red-100"
                  aria-label="Delete Bookmark"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}