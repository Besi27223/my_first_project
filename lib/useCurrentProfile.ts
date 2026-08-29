export const isDemoMode = () => process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export { useCurrentProfileContext as useCurrentProfile } from "@/components/CurrentProfileProvider";
