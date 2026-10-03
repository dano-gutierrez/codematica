import { getContentIndex } from "@codematica/core";
import { NativeGameMap } from "@codematica/ui/game";
import { useRouter } from "expo-router";
import { nativeGameStore } from "../src/lib/game-store";
export default function GameHome(){const campaign=getContentIndex().gameCampaigns[0],router=useRouter();return <NativeGameMap campaign={campaign} store={nativeGameStore(campaign)} navigate={route=>router.push(route as never)}/>;}
