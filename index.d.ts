
declare function figgyPudding<
  S extends figgyPudding.Specs = {},
  O extends figgyPudding.Options = {}
>(specs?: S, opts?: O): figgyPudding.PuddingFactory<S, O>

declare module figgyPudding {
  interface Options {
    other?(key: string): boolean
  }

  type OtherOpt = Required<Pick<Options, 'other'>>

  type Specs = {
    [K in string]: string | Spec
  }
  interface Spec {
    default?: any
  }

  type SpecWithDefault = Required<Pick<Spec, 'default'>>
  type SpecDefault<S> = S extends {default(): infer R} ? R : S extends {default: infer D} ? D : unknown


  interface MapLike<K, V> {
    get(key: K): V | undefined
  }

  type SpecKeys<S> = {
    [K in keyof S]: S[K] extends string ? never : K
  }[keyof S]
  type AvailableKeys<S, O, V> = O extends OtherOpt ? string : {
    [K in SpecKeys<S>]: K extends keyof V ? K : S[K] extends SpecWithDefault ? K : never
  }[SpecKeys<S>]

  type Shadow<T, U> = {
    [K in Exclude<keyof T, keyof U>]: T[K]
  } & U

  type Proxy<S, O, V> = {
    [K in SpecKeys<S>]: K extends keyof V ? V[K] : SpecDefault<S[K]>
  } & (O extends {other(key: string): boolean} ? {
    [key: string]: any
  } : {})

  type ProxyFiggyPudding<S, O, V> = Readonly<Proxy<S, O, V>> & FiggyPudding<S, O, V>

  type MapLikeToRecord<M extends MapLike<string, any>> = {
    [K in (M extends MapLike<infer K, any> ? K : string)]: (M extends MapLike<any, infer V> ? V : any)
  }

  type Clean<T> = T extends object ? T extends undefined | null ? {} : T & (T extends MapLike<string, any> ? MapLikeToRecord<T> : {}) : {}

  // TODO: shadow here
  type Merge<T extends any[]> =
    T extends [infer A, infer B, infer C, infer D, infer E] ? Clean<A> & Clean<B> & Clean<C> & Clean<D> & Clean<E> :
    T extends [infer A, infer B, infer C, infer D] ? Clean<A> & Clean<B> & Clean<C> & Clean<D> :
    T extends [infer A, infer B, infer C] ? Clean<A> & Clean<B> & Clean<C>:
    T extends [infer A, infer B] ? Clean<A> & Clean<B>:
    T extends [infer A] ? Clean<A> :
    T extends [] ? {} : any

  type PuddingFactory<S, O> = <P extends any[]>(...providers: P) => ProxyFiggyPudding<S, O, Merge<P>>

  interface FiggyPuddingConstructor {
    new <S extends Specs, O extends Options, P extends any[]>(
      specs: S, opts: O, providers: Merge<P>
      ): FiggyPudding<S, O, Merge<P>>
  }

  interface FiggyPudding<S, O, V extends {[K in string]: any}> {
    readonly __isFiggyPudding: true
    readonly [Symbol.toStringTag]: 'FiggyPudding'

    get<K extends AvailableKeys<S, O, V>>(key: K): K extends keyof V ? V[K] : K extends keyof S ? SpecDefault<S[K]> : unknown
    concat<P extends any[]>(...providers: P): ProxyFiggyPudding<S, O, Shadow<V, Merge<P>>>
    toJSON(): {
      [K in AvailableKeys<S, O, V>]: K extends keyof V ? V[K] : K extends keyof S ? SpecDefault<S[K]> : unknown
    }
    forEach<This = this>(
      fn: (this: This, value: unknown, key: SpecKeys<S>, opts: this) => void,
      thisArg: This
    ): void
    entries(matcher: (key: string) => boolean): IterableIterator<[string, unknown]>
    entries(): IterableIterator<[AvailableKeys<S, O, V>, unknown]>
    [Symbol.iterator]: IterableIterator<[AvailableKeys<S, O, V>, unknown]>
    keys(): IterableIterator<AvailableKeys<S, O, V>>
    values(): IterableIterator<unknown>
  }
}

export = figgyPudding
