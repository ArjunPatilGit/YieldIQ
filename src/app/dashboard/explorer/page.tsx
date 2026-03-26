
"use client";

import { useState } from "react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database, User, Home, Shield, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

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

  const { data: profileData, isLoading: isProfileLoading } = useDoc(profileRef);
  const { data: farmData, isLoading: isFarmLoading } = useDoc(farmRef);

  const filterData = (data: any) => {
    if (!data) return [];
    return Object.entries(data).filter(([key, val]) => 
      key.toLowerCase().includes(searchQuery.toLowerCase()) || 
      String(val).toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-headline flex items-center gap-2">
          <Database className="h-6 w-6 text-primary" />
          Database Explorer
        </h1>
        <p className="text-muted-foreground">View real-time records stored in your Firestore database instance.</p>
      </div>

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
            User Profile
          </TabsTrigger>
          <TabsTrigger value="farm" className="gap-2">
            <Home className="h-4 w-4" />
            Farm Records
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>UserProfile Collection</CardTitle>
              <CardDescription>Path: /users/{user?.uid}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Field Key</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead className="text-right">Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isProfileLoading ? (
                    <TableRow><TableCell colSpan={3} className="text-center">Loading database...</TableCell></TableRow>
                  ) : filterData(profileData).length > 0 ? (
                    filterData(profileData).map(([key, value]) => (
                      <TableRow key={key}>
                        <TableCell className="font-mono text-xs font-semibold">{key}</TableCell>
                        <TableCell className="max-w-[400px] truncate">
                          {value instanceof Object ? JSON.stringify(value) : String(value)}
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">{typeof value}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={3} className="text-center py-10 text-muted-foreground">No matching records found.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="farm" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Farm Collection</CardTitle>
              <CardDescription>Path: /users/{user?.uid}/farms/primary</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Field Key</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead className="text-right">Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isFarmLoading ? (
                    <TableRow><TableCell colSpan={3} className="text-center">Loading database...</TableCell></TableRow>
                  ) : filterData(farmData).length > 0 ? (
                    filterData(farmData).map(([key, value]) => (
                      <TableRow key={key}>
                        <TableCell className="font-mono text-xs font-semibold">{key}</TableCell>
                        <TableCell className="max-w-[400px] truncate">
                          {value instanceof Object ? JSON.stringify(value) : String(value)}
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">{typeof value}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={3} className="text-center py-10 text-muted-foreground">No farm data recorded yet. Update your profile to see changes.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex items-center gap-2 p-4 rounded-lg bg-primary/5 border border-primary/10 text-xs text-muted-foreground">
        <Shield className="h-4 w-4 text-primary" />
        Passwords and sensitive auth credentials are not stored in Firestore. They are managed by Firebase Authentication and are never visible in the application database view.
      </div>
    </div>
  );
}
