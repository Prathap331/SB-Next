'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Link, LineChart } from "lucide-react";

interface GeneratedScriptProps {
  script: string;
  estimated_word_count: number;
  source_urls: string[];
  analysis: {
    examples_count: number;
    research_facts_count: number;
    proverbs_count: number;
    emotional_depth: string;
  };
}

export function GeneratedScript({
  script,
  estimated_word_count,
  source_urls,
  analysis,
}: GeneratedScriptProps) {
  // Helper: convert plain text into nodes with formatting rules
  const renderScriptWithFormatting = (text: string): React.ReactNode[] => {
    const nodes: React.ReactNode[] = [];
    if (!text) return nodes;

    // Split by triple-asterisks '***' to inject horizontal rules
    const parts = text.split(/\*\*\*/);

    parts.forEach((part, partIndex) => {
      // Parse inline **bold** and *semibold* (process double first)
      const inlineNodes: React.ReactNode[] = [];
      const regex = /\*\*(.+?)\*\*|\*(.+?)\*/g;
      let lastIndex = 0;
      let match: RegExpExecArray | null;
      let inlineKey = 0;

      const pushText = (s: string) => {
        if (!s) return;
        // preserve newlines
        const lines = s.split('\n');
        lines.forEach((line, idx) => {
          if (line) inlineNodes.push(line);
          if (idx < lines.length - 1) inlineNodes.push(<br key={`br-${partIndex}-${inlineKey++}-${idx}`} />);
        });
      };

      while ((match = regex.exec(part)) !== null) {
        const matchIndex = match.index;
        if (matchIndex > lastIndex) {
          pushText(part.slice(lastIndex, matchIndex));
        }

        if (match[1] !== undefined) {
          // double asterisks -> bold
          inlineNodes.push(
            <strong key={`b-${partIndex}-${inlineKey++}`}>{match[1]}</strong>
          );
        } else if (match[2] !== undefined) {
          // single asterisk -> semibold
          inlineNodes.push(
            <span key={`sb-${partIndex}-${inlineKey++}`} className="font-semibold">
              {match[2]}
            </span>
          );
        }

        lastIndex = regex.lastIndex;
      }

      if (lastIndex < part.length) {
        pushText(part.slice(lastIndex));
      }

      // If nothing matched, still push the raw part (with newlines handled)
      if (inlineNodes.length === 0) {
        pushText(part);
      }

      // Append inline nodes to main nodes array. Wrap in span to keep group keyed.
      nodes.push(
        <span key={`part-${partIndex}`} className="whitespace-pre-wrap">
          {inlineNodes}
        </span>
      );

      // After each part except the last, insert an <hr />
      if (partIndex < parts.length - 1) {
        nodes.push(<hr key={`hr-${partIndex}`} className="my-6 border-gray-200" />);
      }
    });

    return nodes;
  };
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center">
            <FileText className="w-6 h-6 mr-2" />
            Generated Script
          </CardTitle>
          <CardDescription>
            Approximately {estimated_word_count} words
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-lg leading-relaxed">
            {/**
             * Rendering rules:
             * - Triple asterisks (***) anywhere produce an <hr />
             * - Double asterisks (**word**) produce bold text
             * - Single asterisk (*word*) produce semibold text
             * - Preserve newlines as <br />
             */}
            {renderScriptWithFormatting(script)}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center">
              <LineChart className="w-5 h-5 mr-2" />
              Script Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Examples Used</span>
              <Badge variant="secondary">{analysis.examples_count}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Research Facts</span>
              <Badge variant="secondary">{analysis.research_facts_count}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Proverbs/Sayings</span>
              <Badge variant="secondary">{analysis.proverbs_count}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Emotional Depth</span>
              <Badge variant="secondary">{analysis.emotional_depth}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center">
              <Link className="w-5 h-5 mr-2" />
              Research Sources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {source_urls.map((url, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Badge variant="outline" className="truncate max-w-[300px]">
                    {url}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(url, '_blank')}
                  >
                    Visit
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}