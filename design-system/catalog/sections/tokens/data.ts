import primitiveJson from "../../../tokens/primitives.tokens.json";
import typographyJson from "../../../tokens/typography.tokens.json";
import themeJson from "../../../tokens/themes/light.tokens.json";

export interface ColorToken {
  $value: string;
}
export interface DimensionToken {
  $value: string;
}
export interface TypographyValue {
  fontFamily: string;
  fontSize: string;
  fontWeight: number;
}
export interface TypographyToken {
  $value: TypographyValue;
}
export interface PrimitiveData {
  color: Record<string, ColorToken>;
  spacing: Record<string, DimensionToken>;
  radius: Record<string, DimensionToken>;
  font: Record<string, { $value: string[] }>;
}
export interface TokenLeaf {
  $value: string | Record<string, unknown>;
}
export interface TokenGroup {
  [key: string]: TokenLeaf | TokenGroup;
}
export interface Copy {
  heading: string;
  pangram: string;
  sample: string;
}
export type Locale = "es" | "en";
export type TokenStyle = { [key: `--${string}`]: string | number };

export const primitives = primitiveJson as PrimitiveData;
export const typography = typographyJson as Record<string, TypographyToken>;
export const semantic = themeJson as TokenGroup;
export const spacingKeys = ["4", "8", "12", "16", "24", "32", "76", "100"];
export const radiusKeys = ["none", "lg", "xl", "2xl", "3xl"];
export const fontKeys = ["serif", "sans", "mono"] as const;

export function keysOf(group: TokenGroup, prefix = ""): string[] {
  return Object.entries(group).flatMap(([key, token]) => {
    const name = prefix ? `${prefix}-${key}` : key;
    return "$value" in token ? [name] : keysOf(token, name);
  });
}
