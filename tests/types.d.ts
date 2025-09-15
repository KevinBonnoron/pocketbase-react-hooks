declare global {
  function setTimeout(callback: () => void, ms?: number): number;
  function clearTimeout(id: number): void;
}

export {};
