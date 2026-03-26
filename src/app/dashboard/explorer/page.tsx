"use client";

import { useState } from "react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database, User, Home, Shield, Search, Info, AlertCircle, Key } from "lucide-react";
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

  const { data: profileData, isLoading: isProfileLoading, error: profileError } = useDoc(profileRef);
  const { data: farmData, isLoading: isFarmLoading, error: farmError } = useDoc(farmRef);

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
          As per administrative requirements, your <strong>Login Details</strong> (UID, Email, Name) are visible for account management. 
          <span className="flex items-center gap-1 mt-2 font-semibold">
            <Key className="h-3 w-3" /> Passwords are never stored in this database and remain encrypted in Firebase Auth.
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
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            Login & Profile
          </TabsTrigger>
          <TabsTrigger value="farm" className="gap-2">
            <Home className="h-4 w-4" />
            Farm Assets
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4">
          <Card className="border-primary/10">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">UserProfile Document</CardTitle>
                  <CardDescription className="font-mono text-[10px]">Path: /users/{user?.uid}</CardDescription>
                </div>
                <Badge variant="outline" className="text-[10px]">Auth Context</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {profileError && (
                <div className="flex items-center gap-2 p-3 mb-4 text-xs text-destructive bg-destructive/5 border border-destructive/10 rounded">
                  <AlertCircle className="h-4 w-4" />
                  Connection Error: {profileError.message}
                </div>
              )}
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[200px] text-xs uppercase tracking-wider">Field Name</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider">Cloud Value</TableHead>
                    <TableHead className="text-right text-xs uppercase tracking-wider">Data Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isProfileLoading ? (
                    <TableRow><TableCell colSpan={3} className="text-center py-12">Synchronizing with primary node...</TableCell></TableRow>
                  ) : filterData(profileData).length > 0 ? (
                    filterData(profileData).map(([key, value]) => (
                      <TableRow key={key} className="group">
                        <TableCell className="font-mono text-xs font-semibold text-primary/80 group-hover:text-primary">{key}</TableCell>
                        <TableCell className="max-w-[400px] truncate font-medium text-sm">
                          {value instanceof Object ? (
                            <code className="text-[10px] bg-muted p-1 rounded">JSON_OBJECT</code>
                          ) : String(value)}
                        </TableCell>
                        <TableCell className="text-right text-[10px] font-mono text-muted-foreground italic">
                          {typeof value}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={3} className="text-center py-16 text-muted-foreground italic">No searchable profile fields discovered.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="farm" className="mt-4">
          <Card className="border-primary/10">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">Farm Asset Document</CardTitle>
                  <CardDescription className="font-mono text-[10px]">Path: .../farms/primary</CardDescription>
                </div>
                <Badge variant="secondary" className="text-[10px]">Agricultural Data</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {farmError && (
                <div className="flex items-center gap-2 p-3 mb-4 text-xs text-destructive bg-destructive/5 border border-destructive/10 rounded">
                  <AlertCircle className="h-4 w-4" />
                  Access Denied: Ensure email is verified to read nested assets.
                </div>
              )}
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[200px] text-xs uppercase tracking-wider">Field Name</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider">Cloud Value</TableHead>
                    <TableHead className="text-right text-xs uppercase tracking-wider">Data Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isFarmLoading ? (
                    <TableRow><TableCell colSpan={3} className="text-center py-12">Querying farm collection...</TableCell></TableRow>
                  ) : filterData(farmData).length > 0 ? (
                    filterData(farmData).map(([key, value]) => (
                      <TableRow key={key} className="group">
                        <TableCell className="font-mono text-xs font-semibold text-accent-foreground group-hover:text-accent-foreground/80">{key}</TableCell>
                        <TableCell className="max-w-[400px] truncate font-medium text-sm italic">
                          {String(value)}
                        </TableCell>
                        <TableCell className="text-right text-[10px] font-mono text-muted-foreground italic">
                          {typeof value}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-20 text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <Home className="h-8 w-8 opacity-20" />
                          <p>No farm records found in the cloud.</p>
                          <p className="text-[10px]">Visit "Farm Profile" to initialize your database.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}