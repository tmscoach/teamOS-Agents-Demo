import React from "react";
import { BlocksDashboard } from "./BlocksDashboard";
import { Button } from "./Button";
import { CardHeader } from "./CardHeader";
import { Separator } from "./Separator";
import googleBlackIcon1 from "./google-black-icon-1.svg";
import microsoftIcon1 from "./microsoft-icon-1.svg";

export const LightSlateAuth = () => {
  return (
    <div
      className="flex w-[1280px] items-start relative border border-solid border-[color:var(--shadcn-ui-border)] shadow-shadow-sm"
      data-shadcn-ui-mode="light-zinc"
    >
      <div className="flex flex-col h-[800px] items-start relative flex-1 grow shadow-[0px_1px_2px_#0000000d] bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0.8)_100%),linear-gradient(0deg,rgba(24,24,27,1)_0%,rgba(24,24,27,1)_100%)] bg-[color:var(--shadcn-ui-primary)]">
        <div className="flex flex-col min-h-[72px] items-start gap-1.5 pt-[var(--tailwind-primitives-padding-py-9)] pr-[var(--tailwind-primitives-padding-px-9)] pl-[var(--tailwind-primitives-padding-px-9)] pb-0 relative self-stretch w-full flex-[0_0_auto]">
          <div className="inline-flex items-center gap-[var(--tailwind-primitives-gap-gap-1-5)] relative flex-[0_0_auto]">
            <BlocksDashboard
              TMSLogoDivClassName="!border-[unset] !h-2 !rounded-[8.08px/4.17px] !border-[1.64px] !border-solid !left-1 !w-4 !top-1"
              TMSLogoDivClassNameOverride="!border-[unset] !h-2 !rounded-[8.08px/4.17px] !border-[1.64px] !border-solid !w-4 !top-2"
              TMSLogoEllipseClassName="!border-[unset] !h-2 !rounded-[8.08px/4.17px] !border-[1.64px] !border-solid !left-px !w-4 !top-[11px]"
              TMSLogoEllipseClassName1="!border-[unset] !h-2 !rounded-[8.08px/4.17px] !border-[1.64px] !border-solid !left-1 !w-4 !top-3"
              TMSLogoEllipseClassName2="!border-[unset] !h-2 !rounded-[8.08px/4.17px] !border-[1.64px] !border-solid !left-[7px] !w-4 !top-[5px]"
              TMSLogoEllipseClassName3="!border-[unset] !h-2 !rounded-[8.08px/4.17px] !border-[1.64px] !border-solid !left-2 !w-4 !top-2"
              TMSLogoEllipseClassNameOverride="!border-[unset] !h-2 !rounded-[8.08px/4.17px] !border-[1.64px] !border-solid !left-[7px] !w-4 !top-[11px]"
              TMSLogoImg="subtract-2.svg"
              TMSLogoSubtract="subtract-3.svg"
              className="!flex-[0_0_auto]"
              divClassName="!text-[color:var(--radix-colours-white-a12)]"
            />
          </div>
        </div>

        <div className="flex flex-col items-start justify-end gap-[var(--tailwind-primitives-gap-gap-4)] pr-[var(--tailwind-primitives-padding-px-8)] pb-[var(--tailwind-primitives-padding-py-8)] pl-[var(--tailwind-primitives-padding-px-8)] pt-0 relative flex-1 self-stretch w-full grow">
          <div className="inline-flex flex-col items-start gap-[var(--tailwind-primitives-gap-gap-2)] relative flex-[0_0_auto]">
            <p className="relative w-[407px] mt-[-1.00px] [font-family:'Inter-Regular',Helvetica] font-normal text-shadcn-ui-primary-foreground text-base tracking-[0] leading-7">
              “TeamOS helped me resolve team conflicts before they even surfaced
              - it&#39;s like having a team dynamics expert whispering in my ear
              24/7.”
            </p>

            <p className="relative w-fit [font-family:'Inter-Bold',Helvetica] font-bold text-shadcn-ui-primary-foreground text-sm tracking-[0] leading-7 whitespace-nowrap">
              Marcus Chen, Engineering Manager, CloudScale Technologies
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col h-[800px] items-start relative flex-1 grow bg-[color:var(--shadcn-ui-card)] shadow-[0px_1px_2px_#0000000d]">
        <div className="items-end gap-1.5 pt-[var(--tailwind-primitives-padding-py-9)] pr-[var(--tailwind-primitives-padding-py-9)] pl-[var(--tailwind-primitives-padding-py-9)] pb-0 flex flex-col relative self-stretch w-full flex-[0_0_auto]">
          <Button size="sm" state="hover" text="Login" type="ghost" />
        </div>

        <div className="items-center justify-center gap-[var(--tailwind-primitives-gap-gap-4)] pr-[var(--tailwind-primitives-padding-px-16)] pl-[var(--tailwind-primitives-padding-px-16)] pt-0 pb-6 flex-1 grow flex flex-col relative self-stretch w-full">
          <div className="flex flex-col w-[440px] items-center justify-center relative flex-1 grow rounded-[var(--tailwind-primitives-rounded-rounded-lg)] shadow-[0px_1px_2px_#0000000d]">
            <CardHeader
              cardDescriptionDivClassName="!flex-1 ![white-space:unset] !text-center !w-[unset]"
              cardDescriptionText="Enter your work email below to create your account"
              cardTitleText="Create an account"
              className="!self-stretch !gap-[var(--tailwind-primitives-gap-gap-3)] !flex-[0_0_auto] !items-center !w-full"
            />
            <div className="items-start gap-[var(--tailwind-primitives-gap-gap-6)] pt-0 pb-6 px-6 flex-[0_0_auto] flex flex-col relative self-stretch w-full">
              <div className="flex-col items-start gap-[var(--tailwind-primitives-gap-gap-2)] flex relative self-stretch w-full flex-[0_0_auto]">
                <div className="flex flex-col items-start gap-1.5 relative self-stretch w-full flex-[0_0_auto]">
                  <div className="flex h-9 items-center gap-2 relative self-stretch w-full">
                    <div className="flex flex-col items-start gap-1.5 relative flex-1 grow">
                      <input
                        className="pl-3 pr-14 py-2 relative self-stretch w-full mt-[-1.00px] mb-[-1.00px] ml-[-1.00px] mr-[-1.00px] rounded-[var(--shadcn-ui-radius-md)] border border-solid border-shadcn-ui-input [background:none] [font-family:'Inter-Regular',Helvetica] font-normal text-[color:var(--shadcn-ui-muted-foreground)] text-sm tracking-[0] leading-5 whitespace-nowrap"
                        placeholder="name@example.com"
                        type="email"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  className="!self-stretch !h-10 !flex !w-full"
                  size="sm"
                  state="default_1"
                  text1="Sign In with Email"
                  type="default"
                />
              </div>

              <div className="items-center gap-[var(--tailwind-primitives-gap-gap-1-5)] flex relative self-stretch w-full flex-[0_0_auto]">
                <Separator
                  className="!flex-1 !relative !grow !w-[unset]"
                  orientation="horizontal"
                />
                <div className="relative w-fit mt-[-1.00px] [font-family:'Inter-Regular',Helvetica] font-normal text-[color:var(--shadcn-ui-muted-foreground)] text-xs tracking-[0] leading-5 whitespace-nowrap">
                  OR CONTINUE WITH
                </div>

                <Separator
                  className="!flex-1 !relative !grow !w-[unset]"
                  orientation="horizontal"
                />
              </div>

              <div className="items-start gap-[var(--tailwind-primitives-gap-gap-6)] flex relative self-stretch w-full flex-[0_0_auto]">
                <button className="all-[unset] box-border flex h-9 flex-1 grow bg-[color:var(--shadcn-ui-background)] border border-solid border-[color:var(--shadcn-ui-border)] items-center justify-center gap-2.5 pr-[var(--tailwind-primitives-padding-px-3)] pl-[var(--tailwind-primitives-padding-px-3)] py-0 relative rounded-[var(--shadcn-ui-radius-md)]">
                  <img
                    className="relative w-4 h-4"
                    alt="Google black icon"
                    src={googleBlackIcon1}
                  />

                  <div className="relative w-fit [font-family:'Inter-Medium',Helvetica] font-medium text-[color:var(--shadcn-ui-foreground)] text-sm tracking-[0] leading-6 whitespace-nowrap">
                    Log in with Google
                  </div>
                </button>
              </div>

              <div className="items-start gap-[var(--tailwind-primitives-gap-gap-6)] flex relative self-stretch w-full flex-[0_0_auto]">
                <button className="all-[unset] box-border flex h-9 flex-1 grow bg-[color:var(--shadcn-ui-background)] border border-solid border-[color:var(--shadcn-ui-border)] items-center justify-center gap-2.5 pr-[var(--tailwind-primitives-padding-px-3)] pl-[var(--tailwind-primitives-padding-px-3)] py-0 relative rounded-[var(--shadcn-ui-radius-md)]">
                  <img
                    className="relative w-4 h-4"
                    alt="Microsoft icon"
                    src={microsoftIcon1}
                  />

                  <div className="relative w-fit [font-family:'Inter-Medium',Helvetica] font-medium text-[color:var(--shadcn-ui-foreground)] text-sm tracking-[0] leading-6 whitespace-nowrap">
                    Log in with Microsoft
                  </div>
                </button>
              </div>

              <div className="flex items-center justify-center pr-[var(--tailwind-primitives-gap-gap-10)] pl-[var(--tailwind-primitives-gap-gap-10)] py-0 relative self-stretch w-full flex-[0_0_auto]">
                <p className="relative flex-1 mt-[-1.00px] [font-family:'Inter-Regular',Helvetica] font-normal text-[color:var(--shadcn-ui-muted-foreground)] text-sm text-center tracking-[0] leading-5">
                  <span className="[font-family:'Inter-Regular',Helvetica] font-normal text-zinc-500 text-sm tracking-[0] leading-5">
                    By clicking continue, you agree to our{" "}
                  </span>

                  <a
                    href="https://ui.shadcn.com/terms"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <span className="underline">Terms of Service</span>
                  </a>

                  <span className="[font-family:'Inter-Regular',Helvetica] font-normal text-zinc-500 text-sm tracking-[0] leading-5">
                    {" "}
                    and{" "}
                  </span>

                  <a
                    href="https://ui.shadcn.com/privacy"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <span className="underline">Privacy Policy</span>
                  </a>

                  <span className="[font-family:'Inter-Regular',Helvetica] font-normal text-zinc-500 text-sm tracking-[0] leading-5">
                    .
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
