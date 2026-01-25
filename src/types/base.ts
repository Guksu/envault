export class TypeBuilder<T> {
  protected _required = false;
  protected _default?: T;
  protected _sensitive = false;
  protected _source?: string;
  protected _validators: ((value: T) => boolean)[] = [];
  protected _transformers: ((value: T) => T)[] = [];

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

  validate(fn: (value: T) => boolean): this {
    this._validators.push(fn);
    return this;
  }

  transform(fn: (value: T) => T): this {
    this._transformers.push(fn);
    return this;
  }

  getData() {
    const isSensitive = this._sensitive;
    const isRequired = this._required;
    const defaultValue = this._default;
    const source = this._source;
    const validators = this._validators;
    const transformers = this._transformers;

    return {
      isSensitive,
      isRequired,
      defaultValue,
      source,
      validators,
      transformers,
    };
  }
}
