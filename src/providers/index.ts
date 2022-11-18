export * from "./discord";
export * from "./github";

export const SocialProvider = {
  discord: "discord",
  github: "github",
};

export type ISocialProvider = keyof typeof SocialProvider;
