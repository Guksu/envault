export class TypeBuilder<T> {
  protected _required = false;
  protected _default?: T;
  protected _sensitive = false;
  protected _source?: string;

  required(): this {
    this._required = true;
    return this;
  }

  default(value: T): this {
    this._default = value;
    return this;
  }

  sensitive(): this {
    this._sensitive = true;
    return this;
  }

  from(source: string): this {
    this._source = source;
    return this;
  }
}
