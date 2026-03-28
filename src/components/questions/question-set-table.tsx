"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast as sonnerToast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Link2 } from "lucide-react";

interface QuestionSetRow {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  created_at: string;
  question_set_items: { question_id: string }[];
}

interface QuestionSetTableProps {
  questionSets: QuestionSetRow[];
}

export function QuestionSetTable({ questionSets }: QuestionSetTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/question-sets/${deleteId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      sonnerToast.success("Question set deleted");
      router.refresh();
    } catch {
      sonnerToast.error("Failed to delete question set");
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Question Sets</h2>
          <p className="text-muted-foreground">
            Create quiz-like sets from your questions
          </p>
        </div>
        <Button size="sm" nativeButton={false} render={<Link href="/question-sets/new" />}>
          New Question Set
        </Button>
      </div>

      {questionSets.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No question sets yet. Create your first one!
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead className="hidden sm:table-cell">Questions</TableHead>
                <TableHead className="hidden sm:table-cell w-28">Permalink</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questionSets.map((qs) => (
                <TableRow key={qs.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/question-sets/${qs.id}/edit`}
                      className="hover:underline"
                    >
                      {qs.title}
                    </Link>
                    {qs.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {qs.description}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="secondary" className="text-xs">
                      {qs.question_set_items.length}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <button
                      type="button"
                      onClick={() => {
                        const url = `${window.location.origin}/qs/${qs.id}`;
                        navigator.clipboard.writeText(url).then(() => {
                          sonnerToast.success("Permalink copied to clipboard");
                        });
                      }}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      title="Copy permalink"
                    >
                      <Link2 className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate max-w-[120px]">/qs/{qs.id.slice(0, 8)}…</span>
                    </button>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          />
                        }
                      >
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 15 15"
                          fill="none"
                        >
                          <path
                            d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM13.625 7.5C13.625 8.12132 13.1213 8.625 12.5 8.625C11.8787 8.625 11.375 8.12132 11.375 7.5C11.375 6.87868 11.8787 6.375 12.5 6.375C13.1213 6.375 13.625 6.87868 13.625 7.5Z"
                            fill="currentColor"
                          />
                        </svg>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          render={
                            <Link href={`/question-sets/${qs.id}/edit`} />
                          }
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteId(qs.id)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Question Set</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this question set? The questions
              themselves will not be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteId(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
