import { useMemo } from "react";
import { useRouter } from "expo-router";
import { InterviewPreparationScreen } from "@codematica/ui";
import { createInterviewClient } from "@codematica/core/interview-preparation";
import { createNativeSupabaseClient } from "../../src/lib/supabase";
export default function InterviewPreparationRoute(){const router=useRouter();const client=useMemo(()=>{const db=createNativeSupabaseClient();return db?createInterviewClient(db):null;},[]);return <InterviewPreparationScreen client={client} onNavigate={route=>router.navigate(route as never)}/>;}
