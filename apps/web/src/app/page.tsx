import { GameMap } from "@/components/game/GameMap";
import { getContentIndex } from "@/lib/content";
export default function HomePage(){return <GameMap campaign={getContentIndex().gameCampaigns[0]}/>;}
