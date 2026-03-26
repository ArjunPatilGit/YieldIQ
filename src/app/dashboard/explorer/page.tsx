"use client";

import { useState } from "react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database, User, Home, Shield, Search, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
          <p className="text-muted-foreground">Inspect your real-time cloud data records.</p>
        </div>
        <div className="flex items-center gap-2 text-xs bg-accent/10 text-accent-foreground px-3 py-1.5 rounded-full border border-accent/20">
          <Shield className="h-3.5 w-3.5" />
          <span>Production Instance: Studio-7939335406</span>
        </div>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Admin Transparency</AlertTitle>
        <AlertDescription>
          As per your request, login details (UID, Email, Names) are stored and visible to administrators. 
          Passwords are <strong>never</strong> stored in Firestore and remain encrypted within Firebase Auth.
        </AlertDescription>
      </Alert>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Filter database fields..." 
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            Auth & Profile
          </TabsTrigger>
          <TabsTrigger value="farm" className="gap-2">
            <Home className="h-4 w-4" />
            Farm Entities
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4">
          <Card className="border-primary/10">
            <CardHeader>
              <CardTitle className="text-lg">User Profile Record</CardTitle>
              <CardDescription>Location: <code className="text-xs bg-muted px-1.5 py-0.5 rounded">/users/{user?.uid}</code></CardDescription>
            </CardHeader>
            <CardContent>
              {profileError && (
                <div className="p-4 mb-4 text-sm text-destructive bg-destructive/5 border border-destructive/10 rounded">
                  Permission Error: {profileError.message}
                </div>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Key</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead className="text-right">Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isProfileLoading ? (
                    <TableRow><TableCell colSpan={3} className="text-center py-8">Synchronizing with cloud...</TableCell></TableRow>
                  ) : filterData(profileData).length > 0 ? (
                    filterData(profileData).map(([key, value]) => (
                      <TableRow key={key}>
                        <TableCell className="font-mono text-xs font-semibold text-primary">{key}</TableCell>
                        <TableCell className="max-w-[400px] truncate font-medium">
                          {value instanceof Object ? JSON.stringify(value) : String(value)}
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">{typeof value}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={3} className="text-center py-10 text-muted-foreground">No matching profile fields found.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="farm" className="mt-4">
          <Card className="border-primary/10">
            <CardHeader>
              <CardTitle className="text-lg">Farm Asset Record</CardTitle>
              <CardDescription>Location: <code className="text-xs bg-muted px-1.5 py-0.5 rounded">.../farms/primary</code></CardDescription>
            </CardHeader>
            <CardContent>
              {farmError && (
                <div className="p-4 mb-4 text-sm text-destructive bg-destructive/5 border border-destructive/10 rounded">
                  Permission Error: {farmError.message}. Ensure email is verified.
                </div>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Key</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead className="text-right">Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isFarmLoading ? (
                    <TableRow><TableCell colSpan={3} className="text-center py-8">Fetching farm data...</TableCell></TableRow>
                  ) : filterData(farmData).length > 0 ? (
                    filterData(farmData).map(([key, value]) => (
                      <TableRow key={key}>
                        <TableCell className="font-mono text-xs font-semibold text-accent-foreground">{key}</TableCell>
                        <TableCell className="max-w-[400px] truncate font-medium">
                          {value instanceof Object ? JSON.stringify(value) : String(value)}
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">{typeof value}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={3} className="text-center py-10 text-muted-foreground">
                      No farm records discovered. Visit "Farm Profile" to initialize your database.
                    </TableCell></TableRow>
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