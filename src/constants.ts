import type { Props } from "astro";
import IconGitHub from "@/assets/icons/IconGitHub.svg";
import { SITE } from "@/config";

export interface Social {
  name: string;
  href: string;
  linkTitle: string;
  icon: (_props: Props) => Element;
}

export const SOCIALS: Social[] = [
  {
    name: "GitHub",
    href: "https://github.com/liunnn1994",
    linkTitle: `${SITE.title} on GitHub`,
    icon: IconGitHub,
  },
] as const;

export const SHARE_LINKS: Social[] = [] as const;
