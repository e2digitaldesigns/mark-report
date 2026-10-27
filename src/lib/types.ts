export type LinkSection = "siren" | "top" | "col1" | "col2" | "col3";
export type LinkKind = "story" | "resource";

export interface Link {
  id: string;
  title: string;
  url: string;
  section: LinkSection;
  kind: LinkKind;
  position: number;
  is_red: boolean;
  is_bold: boolean;
  image_url: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface SiteSettings {
  site_name: string;
  tagline: string | null;
  show_siren: boolean;
  updated_at: string;
}

export const SECTIONS: { value: LinkSection; label: string }[] = [
  { value: "siren", label: "Siren (lead headline)" },
  { value: "top", label: "Top stories" },
  { value: "col1", label: "Left column" },
  { value: "col2", label: "Center column" },
  { value: "col3", label: "Right column" },
];

export const sectionLabel = (s: LinkSection) =>
  SECTIONS.find((x) => x.value === s)?.label ?? s;
