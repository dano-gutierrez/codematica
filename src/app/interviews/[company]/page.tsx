import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InterviewCompanyDetail } from "@/components/InterviewCatalog";
import { getContentIndex, getInterviewCompanyBySlug } from "@/lib/content";

type InterviewCompanyPageProps = {
  params: Promise<{
    company: string;
  }>;
};

export function generateStaticParams() {
  return getContentIndex().interviewCompanies.map((company) => ({
    company: company.slug,
  }));
}

export async function generateMetadata({ params }: InterviewCompanyPageProps): Promise<Metadata> {
  const { company: companySlug } = await params;
  const company = getInterviewCompanyBySlug(companySlug);

  return {
    title: company ? `${company.name} Interview Coding Prep - Codematica` : "Interview company not found - Codematica",
    description: company?.summary,
  };
}

export default async function InterviewCompanyPage({ params }: InterviewCompanyPageProps) {
  const { company: companySlug } = await params;
  const company = getInterviewCompanyBySlug(companySlug);

  if (!company) {
    notFound();
  }

  return <InterviewCompanyDetail company={company} />;
}
