"use client";
// The floating layer of a field's list (Combobox, ChipInput suggestions, TimePicker): portaled over everything, so
// a Card's overflow never cuts it and a sticky bar never covers it. Not exported from the package. Styles:
// internal/floating-list.css.
import * as PopoverPrimitive from "@radix-ui/react-popover";
import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
  type RefObject,
} from "react";

/** The foot of the useful area: the BottomBar (SavingBar, FormActions) publishes its height in --toast-offset-bottom. */
function bottomInset() {
  if (typeof document === "undefined") return 16;
  const bar = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue(
      "--toast-offset-bottom",
    ),
  );
  return Number.isFinite(bar) && bar > 0 ? bar : 16;
}

/**
 * Below the field when it fits, above it when it doesn't (flip), and when neither side has room the list shrinks to
 * the room there is and scrolls inside (max-height from --radix-popover-content-available-height). It never pushes the
 * page nor makes it scroll longer. The field keeps the focus: the layer neither takes it nor gives it back.
 */
export function FloatingList({
  open,
  field,
  className,
  children,
}: {
  open: boolean;
  /** Any element inside the field: the layer lines up with its box (.rds-field__box), or the element itself. */
  field: RefObject<HTMLElement | null>;
  className?: string;
  children: ReactNode;
}) {
  const [bottom, setBottom] = useState(16);
  const anchor = useMemo(
    () => ({
      current: {
        getBoundingClientRect: () => {
          const el = field.current;
          return (
            (
              el?.closest<HTMLElement>(".rds-field__box") ?? el
            )?.getBoundingClientRect() ?? new DOMRect()
          );
        },
      },
    }),
    [field],
  );
  useEffect(() => {
    if (open) setBottom(bottomInset());
  }, [open]);
  return (
    <PopoverPrimitive.Root open={open}>
      <PopoverPrimitive.Anchor virtualRef={anchor} />
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          role="presentation"
          side="bottom"
          align="start"
          sideOffset={4}
          collisionPadding={{ top: 16, right: 16, left: 16, bottom }}
          className={["rds-floating-list", className].filter(Boolean).join(" ")}
          onOpenAutoFocus={(event) => event.preventDefault()}
          onCloseAutoFocus={(event) => event.preventDefault()}
          // The field owns open and closed (its blur and Escape); a press on an option keeps the focus in the field.
          onInteractOutside={(event) => event.preventDefault()}
          onEscapeKeyDown={(event) => event.preventDefault()}
        >
          {children}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
