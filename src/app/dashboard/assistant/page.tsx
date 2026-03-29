"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { localLanguageAssistant } from "@/ai/flows/local-language-assistant";
import { scanPlantHealth, PlantScannerOutput } from "@/ai/flows/plant-scanner-flow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare, Send, Languages, User, Bot, Loader2,
  Microscope, Upload, ImageIcon, AlertTriangle, CheckCircle2,
  Leaf, FlaskConical, ShieldCheck, Zap, X, ChevronDown, ChevronUp
} from "lucide-react";

interface TextMessage {
  type: "text";
  role: "user" | "assistant";
  content: string;
}

interface DiagnosticMessage {
  type: "diagnostic";
  role: "assistant";
  imageSrc: string;
  result: PlantScannerOutput;
}

type Message = TextMessage | DiagnosticMessage;

const severityColor = {
  Mild: "bg-yellow-100 text-yellow-800 border-yellow-300",
  Moderate: "bg-orange-100 text-orange-800 border-orange-300",
  Severe: "bg-red-100 text-red-800 border-red-300",
};

const confidenceColor = {
  High: "bg-emerald-100 text-emerald-700",
  Medium: "bg-blue-100 text-blue-700",
  Low: "bg-gray-100 text-gray-700",
};

function DiagnosticCard({ result, imageSrc }: { result: PlantScannerOutput; imageSrc: string }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="rounded-2xl border border-[#56A43B]/30 bg-white overflow-hidden shadow-lg">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#56A43B] to-[#3d7a2a] p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Microscope className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-white font-black text-sm uppercase tracking-wider">Plant Health Diagnostic</p>
              <p className="text-white/70 text-[10px] font-medium">AI Vision Analysis Complete</p>
            </div>
          </div>
          <button onClick={() => setExpanded(v => !v)} className="text-white/80 hover:text-white transition-colors">
            {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
        </div>

        {/* Image + Quick Stats */}
        <div className="flex gap-4 p-4 bg-gray-50 border-b border-gray-100">
          <img src={imageSrc} alt="Scanned plant" className="h-24 w-24 rounded-xl object-cover border-2 border-[#56A43B]/20 shrink-0" />
          <div className="flex-1 space-y-2">
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Identified Disease</p>
              <p className="font-black text-lg text-gray-900 leading-tight">{result.diseaseName}</p>
              <p className="text-xs text-gray-400 italic">{result.scientificName}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${severityColor[result.severity]}`}>
                {result.severity} Severity
              </span>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${confidenceColor[result.confidence]}`}>
                {result.confidence} Confidence
              </span>
              {result.affectedCrop && (
                <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-[#56A43B]/10 text-[#56A43B]">
                  🌿 {result.affectedCrop}
                </span>
              )}
            </div>
          </div>
        </div>

        {expanded && (
          <div className="p-4 space-y-4">
            {/* Root Cause */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <p className="text-xs font-black uppercase tracking-wider text-gray-600">Root Cause</p>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed bg-orange-50 p-3 rounded-xl border border-orange-100">
                {result.rootCause}
              </p>
            </div>

            {/* Immediate Actions */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-red-500" />
                <p className="text-xs font-black uppercase tracking-wider text-gray-600">Immediate Actions</p>
              </div>
              <ul className="space-y-1.5">
                {result.immediateActions.map((action, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="h-5 w-5 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">{i + 1}</span>
                    {action}
                  </li>
                ))}
              </ul>
            </div>

            {/* Organic & Chemical Treatments */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Leaf className="h-4 w-4 text-[#56A43B]" />
                  <p className="text-xs font-black uppercase tracking-wider text-gray-600">Organic Remedies</p>
                </div>
                <ul className="space-y-1">
                  {result.organicTreatments.map((t, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-gray-700 bg-[#56A43B]/5 p-2 rounded-lg border border-[#56A43B]/10">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#56A43B] shrink-0 mt-0.5" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FlaskConical className="h-4 w-4 text-blue-500" />
                  <p className="text-xs font-black uppercase tracking-wider text-gray-600">Chemical Treatments</p>
                </div>
                <ul className="space-y-1">
                  {result.chemicalTreatments.map((t, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-gray-700 bg-blue-50 p-2 rounded-lg border border-blue-100">
                      <FlaskConical className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Prevention */}
            {result.preventionTips?.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="h-4 w-4 text-[#56A43B]" />
                  <p className="text-xs font-black uppercase tracking-wider text-gray-600">Prevention Tips</p>
                </div>
                <ul className="flex flex-wrap gap-2">
                  {result.preventionTips.map((tip, i) => (
                    <li key={i} className="text-[11px] bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full font-medium border border-gray-200">
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-[10px] text-gray-400 text-center italic pt-2 border-t border-gray-100">
              You can now ask me follow-up questions about this diagnosis in the chat above.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    { type: "text", role: "assistant", content: "Namaste! I am your YieldIQ Assistant. You can ask me farming questions in Hindi, Marathi, or English — or use the Plant Health Scanner below to diagnose infected leaves." }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, isScanning]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { type: "text", role: "user", content: userMessage }]);
    setIsLoading(true);
    try {
      const result = await localLanguageAssistant({ query: userMessage });
      setMessages(prev => [...prev, { type: "text", role: "assistant", content: result.response }]);
    } catch {
      setMessages(prev => [...prev, { type: "text", role: "assistant", content: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = useCallback(async (file: File) => {
    if (!file || !file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUri = e.target?.result as string;
      setPreviewSrc(dataUri);
      setIsScanning(true);

      setMessages(prev => [...prev, {
        type: "text", role: "user",
        content: `📷 Uploaded leaf image: "${file.name}" for plant health scan.`
      }]);

      try {
        const result = await scanPlantHealth({ imageDataUri: dataUri });
        setMessages(prev => [...prev, { type: "diagnostic", role: "assistant", imageSrc: dataUri, result }]);
      } catch (err: any) {
        setMessages(prev => [...prev, {
          type: "text", role: "assistant",
          content: `❌ Scan failed: ${err.message}. Please check your API key or retry.`
        }]);
      } finally {
        setIsScanning(false);
        setPreviewSrc(null);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleImageUpload(file);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold font-headline">YieldIQ Assistant</h1>
          <p className="text-sm text-muted-foreground">Expert farming advice + AI Plant Disease Detection.</p>
        </div>
        <div className="flex items-center gap-2 bg-secondary/50 px-3 py-1 rounded-full border border-primary/10">
          <Languages className="h-4 w-4 text-primary" />
          <span className="text-xs font-medium">Hindi • Marathi • English</span>
        </div>
      </div>

      {/* Chat Window */}
      <Card className="flex-1 overflow-hidden flex flex-col border-primary/10 min-h-0">
        <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto h-0 scroll-smooth">
            <div className="space-y-4">
              {messages.map((m, i) => {
                if (m.type === "diagnostic") {
                  return (
                    <div key={i} className="flex justify-start">
                      <div className="flex gap-3 w-full">
                        <div className="h-8 w-8 rounded-full bg-[#56A43B] text-white flex items-center justify-center shrink-0 mt-1">
                          <Microscope className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <DiagnosticCard result={m.result} imageSrc={m.imageSrc} />
                        </div>
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`flex gap-3 max-w-[80%] ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-primary"}`}>
                        {m.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                      </div>
                      <div className={`rounded-2xl px-4 py-2 text-sm leading-relaxed ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                        {m.content}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Loading states */}
              {(isLoading || isScanning) && (
                <div className="flex justify-start">
                  <div className="flex gap-3 max-w-[80%]">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${isScanning ? "bg-[#56A43B]" : "bg-secondary"} text-white`}>
                      {isScanning ? <Microscope className="h-4 w-4" /> : <Bot className="h-4 w-4 text-primary" />}
                    </div>
                    <div className="bg-muted rounded-2xl px-4 py-3 flex items-center gap-3">
                      {isScanning && previewSrc && (
                        <img src={previewSrc} alt="Scanning..." className="h-10 w-10 rounded-lg object-cover border border-[#56A43B]/30" />
                      )}
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span className="text-xs text-muted-foreground font-medium">
                          {isScanning ? "🔬 Scanning & Analyzing leaf..." : "YieldIQ is thinking..."}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} className="h-1" />
            </div>
          </div>

          {/* Text Input */}
          <div className="p-4 border-t bg-muted/30 shrink-0">
            <div className="flex gap-2">
              <Input
                placeholder="Ask about crops, soil, weather, pests..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
                }}
                className="bg-background border-primary/20"
                disabled={isScanning}
              />
              <Button onClick={handleSend} disabled={isLoading || isScanning || !input.trim()}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plant Health Scanner */}
      <Card className="border-[#56A43B]/30 bg-gradient-to-br from-[#56A43B]/5 to-white shrink-0">
        <CardHeader className="pb-3 pt-4 px-5">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-black flex items-center gap-2 text-[#3d7a2a]">
              <div className="h-8 w-8 rounded-xl bg-[#56A43B] flex items-center justify-center">
                <Microscope className="h-4 w-4 text-white" />
              </div>
              Plant Health Scanner
              <Badge className="bg-[#56A43B]/10 text-[#56A43B] border-[#56A43B]/20 text-[10px] font-bold border ml-1">AI Vision</Badge>
            </CardTitle>
            <p className="text-xs text-muted-foreground hidden sm:block">Upload a photo of any infected leaf for instant AI diagnosis</p>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          {/* Drop Zone */}
          <div
            className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-200 cursor-pointer
              ${isDragging ? "border-[#56A43B] bg-[#56A43B]/10 scale-[1.01]" : "border-[#56A43B]/30 hover:border-[#56A43B]/60 hover:bg-[#56A43B]/5"}
              ${isScanning ? "pointer-events-none opacity-60" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => !isScanning && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFilePick}
            />

            {isScanning ? (
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-[#56A43B]/20 animate-ping" />
                  <div className="relative h-14 w-14 rounded-2xl bg-[#56A43B] flex items-center justify-center">
                    <Microscope className="h-8 w-8 text-white animate-pulse" />
                  </div>
                </div>
                <div>
                  <p className="font-black text-[#3d7a2a] text-sm uppercase tracking-widest animate-pulse">Scanning & Analyzing...</p>
                  <p className="text-xs text-muted-foreground mt-1">AI Vision model is diagnosing the plant</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-[#56A43B]/10 border-2 border-[#56A43B]/20 flex items-center justify-center shrink-0">
                  {isDragging ? <ImageIcon className="h-7 w-7 text-[#56A43B]" /> : <Upload className="h-7 w-7 text-[#56A43B]/60" />}
                </div>
                <div className="text-left">
                  <p className="font-black text-sm text-gray-800">
                    {isDragging ? "Drop your image here!" : "Drag & Drop or Click to Upload"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    JPEG / PNG / WEBP • Infected leaves of Cotton, Rice, Wheat, Soybean, etc.
                  </p>
                  <p className="text-[10px] text-[#56A43B] font-semibold mt-1">⚡ Powered by Gemini Vision AI</p>
                </div>
                <Button
                  size="sm"
                  className="bg-[#56A43B] hover:bg-[#3d7a2a] text-white shrink-0 gap-2 font-bold"
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                >
                  <Microscope className="h-4 w-4" />
                  Scan Infected Leaf
                </Button>
              </div>
            )}
          </div>

          {/* Quick Crop Queries */}
          <div className="mt-3 flex flex-wrap gap-2 justify-center">
            {["How much water does wheat need?", "पिकावर कीड पडली तर काय करावे?", "मिट्टी की उर्वरता कैसे बढ़ाएं?", "Cotton bollworm treatment?"].map((q, i) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                className="rounded-full text-xs bg-background hover:bg-primary/5 hover:border-primary/50"
                onClick={() => setInput(q)}
              >
                {q}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}