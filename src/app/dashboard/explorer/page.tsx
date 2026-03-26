"use client";

import { useState } from "react";
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { doc, collection } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database, User, Home, Shield, Search, Info, AlertCircle, Key, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

export default function DatabaseExplorerPage() {
  const { user } = useUser();
  const db = useFirestore();
  const [searchQuery, setSearchQuery] = useState("");

  const profileRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);

  const farmRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid, "farms", "primary");
  }, [db, user]);

  const reportsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, "users", user.uid, "advisory_reports");
  }, [db, user]);

  const { data: profileData, isLoading: isProfileLoading, error: profileError } = useDoc(profileRef);
  const { data: farmData, isLoading: isFarmLoading, error: farmError } = useDoc(farmRef);
  const { data: reportsData, isLoading: isReportsLoading } = useCollection(reportsQuery);

  const filterData = (data: any) => {
    if (!data) return [];
    return Object.entries(data).filter(([key, val]) => 
      key.toLowerCase().includes(searchQuery.toLowerCase()) || 
      String(val).toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-headline flex items-center gap-2">
            <Database className="h-6 w-6 text-primary" />
            Database Explorer
          </h1>
          <p className="text-muted-foreground">Inspect your real-time cloud data records for administrative transparency.</p>
        </div>
        <div className="flex items-center gap-2 text-[10px] bg-accent/10 text-accent-foreground px-3 py-1.5 rounded-full border border-accent/20">
          <Shield className="h-3.5 w-3.5" />
          <span className="font-mono">PROD_INSTANCE: STUDIO_YI_7939335406</span>
        </div>
      </div>

      <Alert className="bg-primary/5 border-primary/20">
        <Info className="h-4 w-4 text-primary" />
        <AlertTitle className="font-bold">Privacy & Transparency Report</AlertTitle>
        <AlertDescription className="text-sm leading-relaxed">
          The following tables represent the raw data stored in YieldIQ's Firestore cluster. 
          <span className="flex items-center gap-1 mt-2 font-semibold">
            <Key className="h-3 w-3" /> Passwords are never stored in this database.
          </span>
        </AlertDescription>
      </Alert>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search fields or values..." 
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="farm" className="gap-2">
            <Home className="h-4 w-4" />
            Farm
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-2">
            <FileText className="h-4 w-4" />
            AI Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4">
          <Card className="border-primary/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">UserProfile</CardTitle>
              <CardDescription className="font-mono text-[10px]">Path: /users/{user?.uid}</CardDescription>
            </CardHeader>
            <CardContent>
              {profileError && <p className="text-xs text-destructive">Error: {profileError.message}</p>}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px] text-xs uppercase">Field</TableHead>
                    <TableHead className="text-xs uppercase">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isProfileLoading ? (
                    <TableRow><TableCell colSpan={2}>Syncing...</TableCell></TableRow>
                  ) : filterData(profileData).map(([key, value]) => (
                    <TableRow key={key}>
                      <TableCell className="font-mono text-xs text-primary">{key}</TableCell>
                      <TableCell className="text-sm">{String(value)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="farm" className="mt-4">
          <Card className="border-primary/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Farm Asset</CardTitle>
              <CardDescription className="font-mono text-[10px]">Path: .../farms/primary</CardDescription>
            </CardHeader>
            <CardContent>
              {farmError && <p className="text-xs text-destructive">Verify email to access farm data.</p>}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px] text-xs uppercase">Field</TableHead>
                    <TableHead className="text-xs uppercase">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isFarmLoading ? (
                    <TableRow><TableCell colSpan={2}>Syncing...</TableCell></TableRow>
                  ) : filterData(farmData).map(([key, value]) => (
                    <TableRow key={key}>
                      <TableCell className="font-mono text-xs text-accent-foreground">{key}</TableCell>
                      <TableCell className="text-sm">{String(value)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="mt-4">
          <Card className="border-primary/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Advisory Reports</CardTitle>
              <CardDescription className="font-mono text-[10px]">Path: .../advisory_reports/</CardDescription>
            </CardHeader>
            <CardContent>
              {isReportsLoading ? (
                <p className="text-sm text-center py-8">Fetching reports...</p>
              ) : reportsData && reportsData.length > 0 ? (
                <div className="space-y-4">
                  {reportsData.map((report) => (
                    <div key={report.id} className="p-4 rounded-lg border bg-muted/20">
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="outline">ID: {report.id.substring(0, 8)}...</Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {report.generatedAt?.toDate?.()?.toLocaleString() || "Recent"}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-primary">{report.advisorySummary}</p>
                      <p className="text-[10px] text-muted-foreground mt-2 truncate">
                        {report.waterOptimization}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-center py-12 text-muted-foreground italic">No AI reports generated yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
