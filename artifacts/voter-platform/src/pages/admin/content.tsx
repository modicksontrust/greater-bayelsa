import { useState } from "react";
import { useCreatePost, useListPosts, useDeletePost } from "@workspace/api-client-react";
import { ObjectUploader } from "@workspace/object-storage-web";
import { format } from "date-fns";
import { FileText, Plus, Trash2, Image as ImageIcon, ExternalLink, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function AdminContent() {
  const { data: posts, isLoading } = useListPosts(
    {},
    { query: { queryKey: ["/api/posts"] } }
  );
  
  const deletePost = useDeletePost({
    mutation: {
      onSuccess: () => {
        useQueryClient().invalidateQueries({ queryKey: ["/api/posts"] });
      }
    }
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in-stagger pt-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-serif tracking-tight mb-2">Content Management</h1>
          <p className="text-muted-foreground font-medium">Manage institutional news and impact reports.</p>
        </div>
        <CreatePostDialog />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          [1,2,3].map(i => <Skeleton key={i} className="h-64 w-full rounded-3xl" />)
        ) : posts?.map(post => (
          <div key={post.id} className="bg-card rounded-3xl border shadow-sm overflow-hidden flex flex-col group relative">
            <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button 
                variant="destructive" 
                size="icon" 
                className="h-8 w-8 rounded-full shadow-md"
                onClick={() => {
                  if (confirm("Delete this post?")) {
                    deletePost.mutate({ id: post.id });
                  }
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            
            {post.imageUrl ? (
              <div className="h-40 overflow-hidden bg-muted">
                <img 
                  src={`${import.meta.env.BASE_URL.replace(/\/$/, '')}/api/storage${post.imageUrl}`} 
                  className="w-full h-full object-cover" 
                />
              </div>
            ) : (
              <div className="h-40 bg-muted/50 flex items-center justify-center border-b">
                <FileText className="w-10 h-10 text-muted-foreground/30" />
              </div>
            )}
            
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className="font-bold uppercase tracking-wider text-[10px] bg-card text-foreground">
                  {post.category}
                </Badge>
                <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
                  {format(new Date(post.createdAt), 'MMM d, yyyy')}
                </span>
              </div>
              <h3 className="font-bold font-serif text-lg leading-snug mb-2 line-clamp-2">{post.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">{post.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CreatePostDialog() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ title: "", body: "", category: "news" as any, imageUrl: "" });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createPost = useCreatePost({
    mutation: {
      onSuccess: () => {
        toast({ title: "Post published." });
        queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
        setOpen(false);
        setFormData({ title: "", body: "", category: "news", imageUrl: "" });
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPost.mutate({ data: formData });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="font-bold shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> New Post
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden rounded-3xl">
        <DialogHeader className="p-8 pb-0">
          <DialogTitle className="text-2xl font-bold font-serif">Publish Report</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="p-8 pt-6 space-y-6">
          <div className="grid md:grid-cols-3 gap-6 items-start">
            <div className="md:col-span-1">
              <Label className="font-bold block mb-3">Cover Image</Label>
              <div className="aspect-square relative group bg-muted/50 rounded-2xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden">
                {formData.imageUrl ? (
                  <img src={`${import.meta.env.BASE_URL.replace(/\/$/, '')}/api/storage${formData.imageUrl}`} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center text-muted-foreground p-4">
                    <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <span className="text-xs font-bold uppercase tracking-wider">Upload</span>
                  </div>
                )}
                
                <ObjectUploader
                  onGetUploadParameters={async (file) => {
                    const res = await fetch(`${import.meta.env.BASE_URL.replace(/\/$/, '')}/api/storage/uploads/request-url`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
                    });
                    const data = await res.json();
                    return { method: 'PUT' as const, url: data.uploadURL, headers: { 'Content-Type': file.type }, objectPath: data.objectPath };
                  }}
                  onComplete={(result) => {
                    const objectPath = (result.successful?.[0]?.meta as any)?.objectPath;
                    if (objectPath) setFormData(p => ({ ...p, imageUrl: objectPath }));
                  }}
                  buttonClassName="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                >
                  <span className="sr-only">Upload cover</span>
                </ObjectUploader>
              </div>
            </div>
            
            <div className="md:col-span-2 space-y-6">
              <div className="space-y-2">
                <Label className="font-bold">Category</Label>
                <Select value={formData.category} onValueChange={v => setFormData(p => ({ ...p, category: v }))} required>
                  <SelectTrigger className="h-12 bg-muted/50 font-semibold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="news">News</SelectItem>
                    <SelectItem value="impact">Impact Report</SelectItem>
                    <SelectItem value="development">Development</SelectItem>
                    <SelectItem value="testimonial">Testimonial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="font-bold">Title</Label>
                <Input 
                  value={formData.title} 
                  onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                  required 
                  className="h-12 bg-muted/50 font-medium"
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="font-bold">Article Body</Label>
            <Textarea 
              value={formData.body} 
              onChange={e => setFormData(p => ({ ...p, body: e.target.value }))}
              required 
              className="min-h-[250px] bg-muted/50 font-medium leading-relaxed resize-y"
            />
          </div>

          <div className="pt-6 border-t flex justify-end">
            <Button type="submit" disabled={createPost.isPending} className="h-12 px-8 font-bold shadow-sm w-full sm:w-auto">
              {createPost.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Publish
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
