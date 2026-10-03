import { notFound } from "next/navigation";
import { getContentIndex } from "@/lib/content";
import { GamePlay } from "@/components/game/GamePlay";
export function generateStaticParams(){return getContentIndex().gameCampaigns.flatMap(c=>c.levels.map(l=>({campaign:c.id,level:l.id})));}
export default async function LevelPage({params}:{params:Promise<{campaign:string;level:string}>}){const p=await params;const campaign=getContentIndex().gameCampaigns.find(c=>c.id===p.campaign);const level=campaign?.levels.find(l=>l.id===p.level);if(!campaign||!level)notFound();return <GamePlay key={`${campaign.id}/${level.id}`} campaign={campaign} level={level}/>;}
