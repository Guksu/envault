export class TypeBuilder<T> {
  protected _required = false;
  protected _default?: T;
  protected _sensitive = false;
  protected _source?: string;
  protected _validators: ((value: T) => boolean)[] = [];
  protected _transformers: ((value: T) => T)[] = [];

  sensitive(): this {
    this._sensitive = true;
    return this;
  }

  from(source: string): this {
    this._source = source;
    return this;
  }

  validate(fn: (value: T) => boolean): this {
    this._validators.push(fn);
    return this;
  }

  transform(fn: (value: T) => T): this {
    this._transformers.push(fn);
    return this;
  }

  getData() {
    return {
      isSensitive: this._sensitive,
      isRequired: this._required,
      defaultValue: this._default,
      source: this._source,
      validators: this._validators,
      transformers: this._transformers,
    };
  }
}
