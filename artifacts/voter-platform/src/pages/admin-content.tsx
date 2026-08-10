import { useState, useRef, useEffect } from "react";
import { useListPosts, useListEvents, useCreatePost, useDeletePost, useCreateEvent, useDeleteEvent } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Trash2, Plus, Loader2 } from "lucide-react";
import { format } from "date-fns";

export function AdminContent() {
  const { data: posts } = useListPosts(undefined, { query: { queryKey: ["/api/posts", "all"] }});
  const { data: events } = useListEvents({ query: { queryKey: ["/api/events"] }});
  
  const createPost = useCreatePost();
  const deletePost = useDeletePost();
  const createEvent = useCreateEvent();
  const deleteEvent = useDeleteEvent();
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const cpRef = useRef(createPost.mutate);
  const dpRef = useRef(deletePost.mutate);
  const ceRef = useRef(createEvent.mutate);
  const deRef = useRef(deleteEvent.mutate);
  
  useEffect(() => { cpRef.current = createPost.mutate; }, [createPost.mutate]);
  useEffect(() => { dpRef.current = deletePost.mutate; }, [deletePost.mutate]);
  useEffect(() => { ceRef.current = createEvent.mutate; }, [createEvent.mutate]);
  useEffect(() => { deRef.current = deleteEvent.mutate; }, [deleteEvent.mutate]);

  // Post form state
  const [postTitle, setPostTitle] = useState("");
  const [postBody, setPostBody] = useState("");
  const [postCategory, setPostCategory] = useState("news");

  // Event form state
  const [eventTitle, setEventTitle] = useState("");
  const [eventDesc, setEventDesc] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle || !postBody) return;
    
    cpRef.current({ data: { title: postTitle, body: postBody, category: postCategory as any } }, {
      onSuccess: () => {
        toast({ title: "Post Created", description: "Successfully published to the portal." });
        queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
        setPostTitle(""); setPostBody(""); setPostCategory("news");
      }
    });
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle || !eventDate || !eventTime) return;
    
    const startsAt = new Date(`${eventDate}T${eventTime}`).toISOString();
    
    ceRef.current({ data: { title: eventTitle, description: eventDesc, location: eventLocation, startsAt } }, {
      onSuccess: () => {
        toast({ title: "Event Created", description: "Successfully scheduled." });
        queryClient.invalidateQueries({ queryKey: ["/api/events"] });
        setEventTitle(""); setEventDesc(""); setEventLocation(""); setEventDate(""); setEventTime("");
      }
    });
  };

  const handleDeletePost = (id: number) => {
    dpRef.current({ id }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/posts"] }) });
  };
  
  const handleDeleteEvent = (id: number) => {
    deRef.current({ id }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/events"] }) });
  };

  return (
    <div className="space-y-6 pb-12 animate-in-stagger">
      <div>
        <h1 className="text-3xl font-bold font-serif tracking-tight">Content Management</h1>
        <p className="text-muted-foreground mt-1">Publish news, opportunities, and events to the member portal.</p>
      </div>

      <Tabs defaultValue="posts" className="space-y-6">
        <TabsList className="bg-muted">
          <TabsTrigger value="posts">News & Opportunities</TabsTrigger>
          <TabsTrigger value="events">Events Calendar</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="space-y-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader><CardTitle>Create New Post</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleCreatePost} className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-medium">Title</label>
                    <Input value={postTitle} onChange={e => setPostTitle(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <Select value={postCategory} onValueChange={setPostCategory}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="news">News</SelectItem>
                        <SelectItem value="job">Job</SelectItem>
                        <SelectItem value="scholarship">Scholarship</SelectItem>
                        <SelectItem value="announcement">Announcement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Body Content</label>
                  <Textarea value={postBody} onChange={e => setPostBody(e.target.value)} required rows={5} className="resize-none" />
                </div>
                <Button type="submit" disabled={createPost.isPending}>
                  {createPost.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />} Publish Post
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            <h3 className="font-bold text-lg">Published Posts</h3>
            {posts?.map(post => (
              <Card key={post.id} className="border-border/50 shadow-sm">
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="flex gap-2 items-center mb-1">
                      <span className="text-xs font-bold uppercase tracking-wider bg-muted px-2 py-1 rounded">{post.category}</span>
                      <span className="text-xs text-muted-foreground">{format(new Date(post.createdAt), 'MMM d, yyyy')}</span>
                    </div>
                    <h4 className="font-bold font-serif">{post.title}</h4>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDeletePost(post.id)} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="events" className="space-y-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader><CardTitle>Schedule New Event</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Event Title</label>
                    <Input value={eventTitle} onChange={e => setEventTitle(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Location</label>
                    <Input value={eventLocation} onChange={e => setEventLocation(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date</label>
                    <Input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Time</label>
                    <Input type="time" value={eventTime} onChange={e => setEventTime(e.target.value)} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea value={eventDesc} onChange={e => setEventDesc(e.target.value)} rows={3} className="resize-none" />
                </div>
                <Button type="submit" disabled={createEvent.isPending}>
                  {createEvent.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />} Schedule Event
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            <h3 className="font-bold text-lg">Upcoming Events</h3>
            {events?.map(event => (
              <Card key={event.id} className="border-border/50 shadow-sm">
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold font-serif">{event.title}</h4>
                    <div className="text-sm text-muted-foreground mt-1">
                      {format(new Date(event.startsAt), 'PPp')} {event.location && `• ${event.location}`}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteEvent(event.id)} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}