"use client";

import { IconContext } from "@phosphor-icons/react";
import type { ReactNode } from "react";

type PhosphorProviderProps = {
  children: ReactNode;
};

export const PhosphorProvider = ({ children }: PhosphorProviderProps) => {
  return (
    <IconContext.Provider
      value={{
        weight: "duotone",
        color: "currentColor",
        mirrored: false,
      }}
    >
      {children}
    </IconContext.Provider>
  );
};
