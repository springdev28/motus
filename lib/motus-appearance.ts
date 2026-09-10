export const APPEARANCE_KEY = 'motus:appearance:v1';
export type Appearance = 'light' | 'dark' | 'system';
export function parseAppearance(value: string | null): Appearance {
  return value === 'dark' || value === 'system' ? value : 'light';
}
export function resolveAppearance(appearance: Appearance, systemDark: boolean) {
  return appearance === 'system' ? (systemDark ? 'dark' : 'light') : appearance;
}
// Runs before paint, including full-page navigation, to avoid a flash of another theme.
export const APPEARANCE_BOOTSTRAP = `(()=>{try{const p=localStorage.getItem('${APPEARANCE_KEY}');const dark=p==='dark'||(p==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=dark?'dark':'light';document.documentElement.classList.toggle('dark',dark);document.documentElement.style.colorScheme=dark?'dark':'light'}catch{document.documentElement.dataset.theme='light';document.documentElement.style.colorScheme='light'}})()`;
