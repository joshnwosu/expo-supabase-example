import "react-native-url-polyfill/auto";
import { useState, useEffect } from "react";
import { supabase } from "./src/lib/supabase";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import Auth from "./src/components/Auth";
import Account from "./src/components/Account";
import { Session } from "@supabase/supabase-js";

export default function App() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);
  return (
    <View>
      <StatusBar style="auto" />
      {session && session.user ? (
        <Account key={session.user.id} session={session} />
      ) : (
        <Auth />
      )}
    </View>
  );
}

const styles = StyleSheet.create({});
