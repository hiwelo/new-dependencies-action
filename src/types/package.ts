export interface Package {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any

  dependencies: Record<string, string>
  devDependencies: Record<string, string>
}
