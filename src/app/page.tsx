'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Upload,
  Type,
  Download,
  Layers,
  Undo2,
  Palette,
  MousePointer,
  RotateCw
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Image Text Editor
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Create stunning designs by adding beautiful text overlays to your images.
            Professional-grade editing tools with an intuitive interface.
          </p>
          <Link href="/editor">
            <Button size="lg" className="text-lg px-8 py-3">
              Start Creating
            </Button>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Upload className="w-10 h-10 text-blue-600 mb-2" />
              <CardTitle>Image Upload</CardTitle>
              <CardDescription>
                Upload PNG images and the canvas automatically matches the aspect ratio
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Type className="w-10 h-10 text-green-600 mb-2" />
              <CardTitle>Rich Text Editing</CardTitle>
              <CardDescription>
                Add multiple text layers with Google Fonts, custom styling, and formatting
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <MousePointer className="w-10 h-10 text-purple-600 mb-2" />
              <CardTitle>Precise Controls</CardTitle>
              <CardDescription>
                Drag, resize, and rotate text layers with snap-to-center guides
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Layers className="w-10 h-10 text-orange-600 mb-2" />
              <CardTitle>Layer Management</CardTitle>
              <CardDescription>
                Organize and reorder layers to control what appears in front or behind
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Undo2 className="w-10 h-10 text-red-600 mb-2" />
              <CardTitle>Undo/Redo</CardTitle>
              <CardDescription>
                Full history with 20+ steps and visual history indicator
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Download className="w-10 h-10 text-indigo-600 mb-2" />
              <CardTitle>Export & Save</CardTitle>
              <CardDescription>
                Export to PNG with original dimensions and autosave to localStorage
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Key Features */}
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Professional Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Text Styling
                </h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Access to all Google Fonts</li>
                  <li>• Font size, weight, and color control</li>
                  <li>• Opacity and alignment options</li>
                  <li>• Multi-line text support</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <RotateCw className="w-5 h-5" />
                  Transform Tools
                </h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Drag and drop positioning</li>
                  <li>• Resize with corner handles</li>
                  <li>• Free rotation control</li>
                  <li>• Keyboard nudging support</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">
            Ready to create your first design?
          </p>
          <Link href="/editor">
            <Button variant="outline" size="lg">
              Launch Editor
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}