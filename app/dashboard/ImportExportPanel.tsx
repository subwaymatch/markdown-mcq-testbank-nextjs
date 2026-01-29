"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { exportMcqs, importMcqs } from "./actions";

const exampleJson = `[
  {
    "title": "Pythagorean theorem",
    "slug": "pythagorean-theorem",
    "content": "# Which sides does the Pythagorean theorem relate?\n\n- [x] The two legs and the hypotenuse :: It applies to right triangles.\n- [ ] Any three sides :: It only works for right triangles.\n\n---\nThe theorem states a^2 + b^2 = c^2 for right triangles."
  }
]`;

export default function ImportExportPanel() {
  const [rawJson, setRawJson] = useState("");
  const [exported, setExported] = useState("");
  const [pending, startTransition] = useTransition();

  const handleImport = () => {
    startTransition(async () => {
      await importMcqs(rawJson || exampleJson);
      setRawJson("");
    });
  };

  const handleExport = () => {
    startTransition(async () => {
      const data = await exportMcqs();
      setExported(data);
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Import &amp; export MCQs</h2>
            <p className="text-sm text-foreground/70">
              Paste JSON to import markdown MCQs or export the current database contents.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={handleExport} disabled={pending}>
            Export JSON
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="mcq-json">Import JSON</Label>
          <Textarea
            id="mcq-json"
            placeholder={exampleJson}
            value={rawJson}
            onChange={(event) => setRawJson(event.target.value)}
          />
          <div className="flex gap-2">
            <Button type="button" onClick={handleImport} disabled={pending}>
              Import JSON
            </Button>
            <Button type="button" variant="ghost" onClick={() => setRawJson(exampleJson)}>
              Load example
            </Button>
          </div>
        </div>
        {exported ? (
          <div className="space-y-2">
            <Label>Exported JSON</Label>
            <Textarea value={exported} readOnly className="min-h-[200px]" />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
