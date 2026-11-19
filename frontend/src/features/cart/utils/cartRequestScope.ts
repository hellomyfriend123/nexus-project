/** Cancels application of obsolete work; server-side mutations already sent cannot be undone. */
export class CartRequestScope {
  private active = true;
  private generation = 0;
  private refreshId = 0;
  constructor(private token: string | null, private currentToken: () => string | null) {}
  current = () => this.active && !!this.token && this.currentToken() === this.token;
  activate() { this.active = true; this.generation++; }
  dispose() { this.active = false; this.generation++; this.refreshId++; }
  bind<A extends unknown[], T>(operation: (...args: A) => Promise<T>) {
    return async (...args: A): Promise<T> => {
      const generation = this.generation;
      if (!this.current()) throw new DOMException('Obsolete cart session', 'AbortError');
      const result = await operation(...args);
      if (!this.current() || generation !== this.generation) throw new DOMException('Obsolete cart response', 'AbortError');
      return result;
    };
  }
  beginRefresh(revision: number, currentRevision: () => number) {
    const id = ++this.refreshId;
    const generation = this.generation;
    return () => this.current() && generation === this.generation && id === this.refreshId && revision === currentRevision();
  }
}
