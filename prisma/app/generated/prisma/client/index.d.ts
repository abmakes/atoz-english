
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model Quiz
 * 
 */
export type Quiz = $Result.DefaultSelection<Prisma.$QuizPayload>
/**
 * Model QuizLike
 * 
 */
export type QuizLike = $Result.DefaultSelection<Prisma.$QuizLikePayload>
/**
 * Model QuizFavorite
 * 
 */
export type QuizFavorite = $Result.DefaultSelection<Prisma.$QuizFavoritePayload>
/**
 * Model Question
 * 
 */
export type Question = $Result.DefaultSelection<Prisma.$QuestionPayload>
/**
 * Model StoredImage
 * 
 */
export type StoredImage = $Result.DefaultSelection<Prisma.$StoredImagePayload>
/**
 * Model Tag
 * 
 */
export type Tag = $Result.DefaultSelection<Prisma.$TagPayload>
/**
 * Model Story
 * Teacher Tools: 4-panel picture story for Cambridge Movers storytelling practice.
 */
export type Story = $Result.DefaultSelection<Prisma.$StoryPayload>
/**
 * Model StoryPanel
 * 
 */
export type StoryPanel = $Result.DefaultSelection<Prisma.$StoryPanelPayload>
/**
 * Model StorySubmission
 * 
 */
export type StorySubmission = $Result.DefaultSelection<Prisma.$StorySubmissionPayload>
/**
 * Model StoryRecording
 * 
 */
export type StoryRecording = $Result.DefaultSelection<Prisma.$StoryRecordingPayload>

/**
 * Enums
 */
export namespace $Enums {
  export const QuestionType: {
  MULTIPLE_CHOICE: 'MULTIPLE_CHOICE',
  TRUE_FALSE: 'TRUE_FALSE',
  SHORT_ANSWER: 'SHORT_ANSWER',
  SORTING: 'SORTING',
  MATCHING: 'MATCHING',
  FILL_IN_THE_BLANK: 'FILL_IN_THE_BLANK',
  TWO_OPTIONS: 'TWO_OPTIONS',
  OPEN_ENDED: 'OPEN_ENDED'
};

export type QuestionType = (typeof QuestionType)[keyof typeof QuestionType]


export const StoryStatus: {
  DRAFT: 'DRAFT',
  READY: 'READY',
  ARCHIVED: 'ARCHIVED'
};

export type StoryStatus = (typeof StoryStatus)[keyof typeof StoryStatus]


export const StorySubmissionStatus: {
  SUBMITTED: 'SUBMITTED',
  REVIEWED: 'REVIEWED'
};

export type StorySubmissionStatus = (typeof StorySubmissionStatus)[keyof typeof StorySubmissionStatus]

}

export type QuestionType = $Enums.QuestionType

export const QuestionType: typeof $Enums.QuestionType

export type StoryStatus = $Enums.StoryStatus

export const StoryStatus: typeof $Enums.StoryStatus

export type StorySubmissionStatus = $Enums.StorySubmissionStatus

export const StorySubmissionStatus: typeof $Enums.StorySubmissionStatus

/**
 * ##  Prisma Client ʲˢ
 * 
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Quizzes
 * const quizzes = await prisma.quiz.findMany()
 * ```
 *
 * 
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   * 
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Quizzes
   * const quizzes = await prisma.quiz.findMany()
   * ```
   *
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): void;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

  /**
   * Add a middleware
   * @deprecated since 4.16.0. For new code, prefer client extensions instead.
   * @see https://pris.ly/d/extensions
   */
  $use(cb: Prisma.Middleware): void

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb, ExtArgs>

      /**
   * `prisma.quiz`: Exposes CRUD operations for the **Quiz** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Quizzes
    * const quizzes = await prisma.quiz.findMany()
    * ```
    */
  get quiz(): Prisma.QuizDelegate<ExtArgs>;

  /**
   * `prisma.quizLike`: Exposes CRUD operations for the **QuizLike** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more QuizLikes
    * const quizLikes = await prisma.quizLike.findMany()
    * ```
    */
  get quizLike(): Prisma.QuizLikeDelegate<ExtArgs>;

  /**
   * `prisma.quizFavorite`: Exposes CRUD operations for the **QuizFavorite** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more QuizFavorites
    * const quizFavorites = await prisma.quizFavorite.findMany()
    * ```
    */
  get quizFavorite(): Prisma.QuizFavoriteDelegate<ExtArgs>;

  /**
   * `prisma.question`: Exposes CRUD operations for the **Question** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Questions
    * const questions = await prisma.question.findMany()
    * ```
    */
  get question(): Prisma.QuestionDelegate<ExtArgs>;

  /**
   * `prisma.storedImage`: Exposes CRUD operations for the **StoredImage** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more StoredImages
    * const storedImages = await prisma.storedImage.findMany()
    * ```
    */
  get storedImage(): Prisma.StoredImageDelegate<ExtArgs>;

  /**
   * `prisma.tag`: Exposes CRUD operations for the **Tag** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Tags
    * const tags = await prisma.tag.findMany()
    * ```
    */
  get tag(): Prisma.TagDelegate<ExtArgs>;

  /**
   * `prisma.story`: Exposes CRUD operations for the **Story** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Stories
    * const stories = await prisma.story.findMany()
    * ```
    */
  get story(): Prisma.StoryDelegate<ExtArgs>;

  /**
   * `prisma.storyPanel`: Exposes CRUD operations for the **StoryPanel** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more StoryPanels
    * const storyPanels = await prisma.storyPanel.findMany()
    * ```
    */
  get storyPanel(): Prisma.StoryPanelDelegate<ExtArgs>;

  /**
   * `prisma.storySubmission`: Exposes CRUD operations for the **StorySubmission** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more StorySubmissions
    * const storySubmissions = await prisma.storySubmission.findMany()
    * ```
    */
  get storySubmission(): Prisma.StorySubmissionDelegate<ExtArgs>;

  /**
   * `prisma.storyRecording`: Exposes CRUD operations for the **StoryRecording** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more StoryRecordings
    * const storyRecordings = await prisma.storyRecording.findMany()
    * ```
    */
  get storyRecording(): Prisma.StoryRecordingDelegate<ExtArgs>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError
  export import NotFoundError = runtime.NotFoundError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics 
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 5.21.1
   * Query Engine version: bf0e5e8a04cada8225617067eaa03d041e2bba36
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion 

  /**
   * Utility Types
   */


  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? K : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    Quiz: 'Quiz',
    QuizLike: 'QuizLike',
    QuizFavorite: 'QuizFavorite',
    Question: 'Question',
    StoredImage: 'StoredImage',
    Tag: 'Tag',
    Story: 'Story',
    StoryPanel: 'StoryPanel',
    StorySubmission: 'StorySubmission',
    StoryRecording: 'StoryRecording'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb extends $Utils.Fn<{extArgs: $Extensions.InternalArgs, clientOptions: PrismaClientOptions }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], this['params']['clientOptions']>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> = {
    meta: {
      modelProps: "quiz" | "quizLike" | "quizFavorite" | "question" | "storedImage" | "tag" | "story" | "storyPanel" | "storySubmission" | "storyRecording"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      Quiz: {
        payload: Prisma.$QuizPayload<ExtArgs>
        fields: Prisma.QuizFieldRefs
        operations: {
          findUnique: {
            args: Prisma.QuizFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuizPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.QuizFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuizPayload>
          }
          findFirst: {
            args: Prisma.QuizFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuizPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.QuizFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuizPayload>
          }
          findMany: {
            args: Prisma.QuizFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuizPayload>[]
          }
          create: {
            args: Prisma.QuizCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuizPayload>
          }
          createMany: {
            args: Prisma.QuizCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.QuizCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuizPayload>[]
          }
          delete: {
            args: Prisma.QuizDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuizPayload>
          }
          update: {
            args: Prisma.QuizUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuizPayload>
          }
          deleteMany: {
            args: Prisma.QuizDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.QuizUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.QuizUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuizPayload>
          }
          aggregate: {
            args: Prisma.QuizAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateQuiz>
          }
          groupBy: {
            args: Prisma.QuizGroupByArgs<ExtArgs>
            result: $Utils.Optional<QuizGroupByOutputType>[]
          }
          count: {
            args: Prisma.QuizCountArgs<ExtArgs>
            result: $Utils.Optional<QuizCountAggregateOutputType> | number
          }
        }
      }
      QuizLike: {
        payload: Prisma.$QuizLikePayload<ExtArgs>
        fields: Prisma.QuizLikeFieldRefs
        operations: {
          findUnique: {
            args: Prisma.QuizLikeFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuizLikePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.QuizLikeFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuizLikePayload>
          }
          findFirst: {
            args: Prisma.QuizLikeFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuizLikePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.QuizLikeFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuizLikePayload>
          }
          findMany: {
            args: Prisma.QuizLikeFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuizLikePayload>[]
          }
          create: {
            args: Prisma.QuizLikeCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuizLikePayload>
          }
          createMany: {
            args: Prisma.QuizLikeCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.QuizLikeCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuizLikePayload>[]
          }
          delete: {
            args: Prisma.QuizLikeDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuizLikePayload>
          }
          update: {
            args: Prisma.QuizLikeUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuizLikePayload>
          }
          deleteMany: {
            args: Prisma.QuizLikeDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.QuizLikeUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.QuizLikeUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuizLikePayload>
          }
          aggregate: {
            args: Prisma.QuizLikeAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateQuizLike>
          }
          groupBy: {
            args: Prisma.QuizLikeGroupByArgs<ExtArgs>
            result: $Utils.Optional<QuizLikeGroupByOutputType>[]
          }
          count: {
            args: Prisma.QuizLikeCountArgs<ExtArgs>
            result: $Utils.Optional<QuizLikeCountAggregateOutputType> | number
          }
        }
      }
      QuizFavorite: {
        payload: Prisma.$QuizFavoritePayload<ExtArgs>
        fields: Prisma.QuizFavoriteFieldRefs
        operations: {
          findUnique: {
            args: Prisma.QuizFavoriteFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuizFavoritePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.QuizFavoriteFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuizFavoritePayload>
          }
          findFirst: {
            args: Prisma.QuizFavoriteFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuizFavoritePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.QuizFavoriteFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuizFavoritePayload>
          }
          findMany: {
            args: Prisma.QuizFavoriteFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuizFavoritePayload>[]
          }
          create: {
            args: Prisma.QuizFavoriteCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuizFavoritePayload>
          }
          createMany: {
            args: Prisma.QuizFavoriteCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.QuizFavoriteCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuizFavoritePayload>[]
          }
          delete: {
            args: Prisma.QuizFavoriteDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuizFavoritePayload>
          }
          update: {
            args: Prisma.QuizFavoriteUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuizFavoritePayload>
          }
          deleteMany: {
            args: Prisma.QuizFavoriteDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.QuizFavoriteUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.QuizFavoriteUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuizFavoritePayload>
          }
          aggregate: {
            args: Prisma.QuizFavoriteAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateQuizFavorite>
          }
          groupBy: {
            args: Prisma.QuizFavoriteGroupByArgs<ExtArgs>
            result: $Utils.Optional<QuizFavoriteGroupByOutputType>[]
          }
          count: {
            args: Prisma.QuizFavoriteCountArgs<ExtArgs>
            result: $Utils.Optional<QuizFavoriteCountAggregateOutputType> | number
          }
        }
      }
      Question: {
        payload: Prisma.$QuestionPayload<ExtArgs>
        fields: Prisma.QuestionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.QuestionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuestionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.QuestionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuestionPayload>
          }
          findFirst: {
            args: Prisma.QuestionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuestionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.QuestionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuestionPayload>
          }
          findMany: {
            args: Prisma.QuestionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuestionPayload>[]
          }
          create: {
            args: Prisma.QuestionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuestionPayload>
          }
          createMany: {
            args: Prisma.QuestionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.QuestionCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuestionPayload>[]
          }
          delete: {
            args: Prisma.QuestionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuestionPayload>
          }
          update: {
            args: Prisma.QuestionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuestionPayload>
          }
          deleteMany: {
            args: Prisma.QuestionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.QuestionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.QuestionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuestionPayload>
          }
          aggregate: {
            args: Prisma.QuestionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateQuestion>
          }
          groupBy: {
            args: Prisma.QuestionGroupByArgs<ExtArgs>
            result: $Utils.Optional<QuestionGroupByOutputType>[]
          }
          count: {
            args: Prisma.QuestionCountArgs<ExtArgs>
            result: $Utils.Optional<QuestionCountAggregateOutputType> | number
          }
        }
      }
      StoredImage: {
        payload: Prisma.$StoredImagePayload<ExtArgs>
        fields: Prisma.StoredImageFieldRefs
        operations: {
          findUnique: {
            args: Prisma.StoredImageFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StoredImagePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.StoredImageFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StoredImagePayload>
          }
          findFirst: {
            args: Prisma.StoredImageFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StoredImagePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.StoredImageFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StoredImagePayload>
          }
          findMany: {
            args: Prisma.StoredImageFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StoredImagePayload>[]
          }
          create: {
            args: Prisma.StoredImageCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StoredImagePayload>
          }
          createMany: {
            args: Prisma.StoredImageCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.StoredImageCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StoredImagePayload>[]
          }
          delete: {
            args: Prisma.StoredImageDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StoredImagePayload>
          }
          update: {
            args: Prisma.StoredImageUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StoredImagePayload>
          }
          deleteMany: {
            args: Prisma.StoredImageDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.StoredImageUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.StoredImageUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StoredImagePayload>
          }
          aggregate: {
            args: Prisma.StoredImageAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateStoredImage>
          }
          groupBy: {
            args: Prisma.StoredImageGroupByArgs<ExtArgs>
            result: $Utils.Optional<StoredImageGroupByOutputType>[]
          }
          count: {
            args: Prisma.StoredImageCountArgs<ExtArgs>
            result: $Utils.Optional<StoredImageCountAggregateOutputType> | number
          }
        }
      }
      Tag: {
        payload: Prisma.$TagPayload<ExtArgs>
        fields: Prisma.TagFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TagFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TagPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TagFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TagPayload>
          }
          findFirst: {
            args: Prisma.TagFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TagPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TagFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TagPayload>
          }
          findMany: {
            args: Prisma.TagFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TagPayload>[]
          }
          create: {
            args: Prisma.TagCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TagPayload>
          }
          createMany: {
            args: Prisma.TagCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.TagCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TagPayload>[]
          }
          delete: {
            args: Prisma.TagDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TagPayload>
          }
          update: {
            args: Prisma.TagUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TagPayload>
          }
          deleteMany: {
            args: Prisma.TagDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TagUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.TagUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TagPayload>
          }
          aggregate: {
            args: Prisma.TagAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTag>
          }
          groupBy: {
            args: Prisma.TagGroupByArgs<ExtArgs>
            result: $Utils.Optional<TagGroupByOutputType>[]
          }
          count: {
            args: Prisma.TagCountArgs<ExtArgs>
            result: $Utils.Optional<TagCountAggregateOutputType> | number
          }
        }
      }
      Story: {
        payload: Prisma.$StoryPayload<ExtArgs>
        fields: Prisma.StoryFieldRefs
        operations: {
          findUnique: {
            args: Prisma.StoryFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StoryPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.StoryFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StoryPayload>
          }
          findFirst: {
            args: Prisma.StoryFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StoryPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.StoryFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StoryPayload>
          }
          findMany: {
            args: Prisma.StoryFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StoryPayload>[]
          }
          create: {
            args: Prisma.StoryCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StoryPayload>
          }
          createMany: {
            args: Prisma.StoryCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.StoryCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StoryPayload>[]
          }
          delete: {
            args: Prisma.StoryDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StoryPayload>
          }
          update: {
            args: Prisma.StoryUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StoryPayload>
          }
          deleteMany: {
            args: Prisma.StoryDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.StoryUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.StoryUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StoryPayload>
          }
          aggregate: {
            args: Prisma.StoryAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateStory>
          }
          groupBy: {
            args: Prisma.StoryGroupByArgs<ExtArgs>
            result: $Utils.Optional<StoryGroupByOutputType>[]
          }
          count: {
            args: Prisma.StoryCountArgs<ExtArgs>
            result: $Utils.Optional<StoryCountAggregateOutputType> | number
          }
        }
      }
      StoryPanel: {
        payload: Prisma.$StoryPanelPayload<ExtArgs>
        fields: Prisma.StoryPanelFieldRefs
        operations: {
          findUnique: {
            args: Prisma.StoryPanelFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StoryPanelPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.StoryPanelFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StoryPanelPayload>
          }
          findFirst: {
            args: Prisma.StoryPanelFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StoryPanelPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.StoryPanelFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StoryPanelPayload>
          }
          findMany: {
            args: Prisma.StoryPanelFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StoryPanelPayload>[]
          }
          create: {
            args: Prisma.StoryPanelCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StoryPanelPayload>
          }
          createMany: {
            args: Prisma.StoryPanelCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.StoryPanelCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StoryPanelPayload>[]
          }
          delete: {
            args: Prisma.StoryPanelDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StoryPanelPayload>
          }
          update: {
            args: Prisma.StoryPanelUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StoryPanelPayload>
          }
          deleteMany: {
            args: Prisma.StoryPanelDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.StoryPanelUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.StoryPanelUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StoryPanelPayload>
          }
          aggregate: {
            args: Prisma.StoryPanelAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateStoryPanel>
          }
          groupBy: {
            args: Prisma.StoryPanelGroupByArgs<ExtArgs>
            result: $Utils.Optional<StoryPanelGroupByOutputType>[]
          }
          count: {
            args: Prisma.StoryPanelCountArgs<ExtArgs>
            result: $Utils.Optional<StoryPanelCountAggregateOutputType> | number
          }
        }
      }
      StorySubmission: {
        payload: Prisma.$StorySubmissionPayload<ExtArgs>
        fields: Prisma.StorySubmissionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.StorySubmissionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StorySubmissionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.StorySubmissionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StorySubmissionPayload>
          }
          findFirst: {
            args: Prisma.StorySubmissionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StorySubmissionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.StorySubmissionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StorySubmissionPayload>
          }
          findMany: {
            args: Prisma.StorySubmissionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StorySubmissionPayload>[]
          }
          create: {
            args: Prisma.StorySubmissionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StorySubmissionPayload>
          }
          createMany: {
            args: Prisma.StorySubmissionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.StorySubmissionCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StorySubmissionPayload>[]
          }
          delete: {
            args: Prisma.StorySubmissionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StorySubmissionPayload>
          }
          update: {
            args: Prisma.StorySubmissionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StorySubmissionPayload>
          }
          deleteMany: {
            args: Prisma.StorySubmissionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.StorySubmissionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.StorySubmissionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StorySubmissionPayload>
          }
          aggregate: {
            args: Prisma.StorySubmissionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateStorySubmission>
          }
          groupBy: {
            args: Prisma.StorySubmissionGroupByArgs<ExtArgs>
            result: $Utils.Optional<StorySubmissionGroupByOutputType>[]
          }
          count: {
            args: Prisma.StorySubmissionCountArgs<ExtArgs>
            result: $Utils.Optional<StorySubmissionCountAggregateOutputType> | number
          }
        }
      }
      StoryRecording: {
        payload: Prisma.$StoryRecordingPayload<ExtArgs>
        fields: Prisma.StoryRecordingFieldRefs
        operations: {
          findUnique: {
            args: Prisma.StoryRecordingFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StoryRecordingPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.StoryRecordingFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StoryRecordingPayload>
          }
          findFirst: {
            args: Prisma.StoryRecordingFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StoryRecordingPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.StoryRecordingFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StoryRecordingPayload>
          }
          findMany: {
            args: Prisma.StoryRecordingFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StoryRecordingPayload>[]
          }
          create: {
            args: Prisma.StoryRecordingCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StoryRecordingPayload>
          }
          createMany: {
            args: Prisma.StoryRecordingCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.StoryRecordingCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StoryRecordingPayload>[]
          }
          delete: {
            args: Prisma.StoryRecordingDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StoryRecordingPayload>
          }
          update: {
            args: Prisma.StoryRecordingUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StoryRecordingPayload>
          }
          deleteMany: {
            args: Prisma.StoryRecordingDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.StoryRecordingUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.StoryRecordingUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StoryRecordingPayload>
          }
          aggregate: {
            args: Prisma.StoryRecordingAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateStoryRecording>
          }
          groupBy: {
            args: Prisma.StoryRecordingGroupByArgs<ExtArgs>
            result: $Utils.Optional<StoryRecordingGroupByOutputType>[]
          }
          count: {
            args: Prisma.StoryRecordingCountArgs<ExtArgs>
            result: $Utils.Optional<StoryRecordingCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Defaults to stdout
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events
     * log: [
     *   { emit: 'stdout', level: 'query' },
     *   { emit: 'stdout', level: 'info' },
     *   { emit: 'stdout', level: 'warn' }
     *   { emit: 'stdout', level: 'error' }
     * ]
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
  }


  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type GetLogType<T extends LogLevel | LogDefinition> = T extends LogDefinition ? T['emit'] extends 'event' ? T['level'] : never : never
  export type GetEvents<T extends any> = T extends Array<LogLevel | LogDefinition> ?
    GetLogType<T[0]> | GetLogType<T[1]> | GetLogType<T[2]> | GetLogType<T[3]>
    : never

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  /**
   * These options are being passed into the middleware as "params"
   */
  export type MiddlewareParams = {
    model?: ModelName
    action: PrismaAction
    args: any
    dataPath: string[]
    runInTransaction: boolean
  }

  /**
   * The `T` type makes sure, that the `return proceed` is not forgotten in the middleware implementation
   */
  export type Middleware<T = any> = (
    params: MiddlewareParams,
    next: (params: MiddlewareParams) => $Utils.JsPromise<T>,
  ) => $Utils.JsPromise<T>

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type QuizCountOutputType
   */

  export type QuizCountOutputType = {
    questions: number
    likes: number
    favorites: number
  }

  export type QuizCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    questions?: boolean | QuizCountOutputTypeCountQuestionsArgs
    likes?: boolean | QuizCountOutputTypeCountLikesArgs
    favorites?: boolean | QuizCountOutputTypeCountFavoritesArgs
  }

  // Custom InputTypes
  /**
   * QuizCountOutputType without action
   */
  export type QuizCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuizCountOutputType
     */
    select?: QuizCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * QuizCountOutputType without action
   */
  export type QuizCountOutputTypeCountQuestionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: QuestionWhereInput
  }

  /**
   * QuizCountOutputType without action
   */
  export type QuizCountOutputTypeCountLikesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: QuizLikeWhereInput
  }

  /**
   * QuizCountOutputType without action
   */
  export type QuizCountOutputTypeCountFavoritesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: QuizFavoriteWhereInput
  }


  /**
   * Count Type StoryCountOutputType
   */

  export type StoryCountOutputType = {
    panels: number
    submissions: number
  }

  export type StoryCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    panels?: boolean | StoryCountOutputTypeCountPanelsArgs
    submissions?: boolean | StoryCountOutputTypeCountSubmissionsArgs
  }

  // Custom InputTypes
  /**
   * StoryCountOutputType without action
   */
  export type StoryCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StoryCountOutputType
     */
    select?: StoryCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * StoryCountOutputType without action
   */
  export type StoryCountOutputTypeCountPanelsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: StoryPanelWhereInput
  }

  /**
   * StoryCountOutputType without action
   */
  export type StoryCountOutputTypeCountSubmissionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: StorySubmissionWhereInput
  }


  /**
   * Count Type StorySubmissionCountOutputType
   */

  export type StorySubmissionCountOutputType = {
    recordings: number
  }

  export type StorySubmissionCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    recordings?: boolean | StorySubmissionCountOutputTypeCountRecordingsArgs
  }

  // Custom InputTypes
  /**
   * StorySubmissionCountOutputType without action
   */
  export type StorySubmissionCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StorySubmissionCountOutputType
     */
    select?: StorySubmissionCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * StorySubmissionCountOutputType without action
   */
  export type StorySubmissionCountOutputTypeCountRecordingsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: StoryRecordingWhereInput
  }


  /**
   * Models
   */

  /**
   * Model Quiz
   */

  export type AggregateQuiz = {
    _count: QuizCountAggregateOutputType | null
    _min: QuizMinAggregateOutputType | null
    _max: QuizMaxAggregateOutputType | null
  }

  export type QuizMinAggregateOutputType = {
    id: string | null
    title: string | null
    description: string | null
    imageUrl: string | null
    quizType: $Enums.QuestionType | null
    authorId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type QuizMaxAggregateOutputType = {
    id: string | null
    title: string | null
    description: string | null
    imageUrl: string | null
    quizType: $Enums.QuestionType | null
    authorId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type QuizCountAggregateOutputType = {
    id: number
    title: number
    description: number
    imageUrl: number
    quizType: number
    tags: number
    statistics: number
    defaultSettings: number
    authorId: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type QuizMinAggregateInputType = {
    id?: true
    title?: true
    description?: true
    imageUrl?: true
    quizType?: true
    authorId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type QuizMaxAggregateInputType = {
    id?: true
    title?: true
    description?: true
    imageUrl?: true
    quizType?: true
    authorId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type QuizCountAggregateInputType = {
    id?: true
    title?: true
    description?: true
    imageUrl?: true
    quizType?: true
    tags?: true
    statistics?: true
    defaultSettings?: true
    authorId?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type QuizAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Quiz to aggregate.
     */
    where?: QuizWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Quizzes to fetch.
     */
    orderBy?: QuizOrderByWithRelationInput | QuizOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: QuizWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Quizzes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Quizzes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Quizzes
    **/
    _count?: true | QuizCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: QuizMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: QuizMaxAggregateInputType
  }

  export type GetQuizAggregateType<T extends QuizAggregateArgs> = {
        [P in keyof T & keyof AggregateQuiz]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateQuiz[P]>
      : GetScalarType<T[P], AggregateQuiz[P]>
  }




  export type QuizGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: QuizWhereInput
    orderBy?: QuizOrderByWithAggregationInput | QuizOrderByWithAggregationInput[]
    by: QuizScalarFieldEnum[] | QuizScalarFieldEnum
    having?: QuizScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: QuizCountAggregateInputType | true
    _min?: QuizMinAggregateInputType
    _max?: QuizMaxAggregateInputType
  }

  export type QuizGroupByOutputType = {
    id: string
    title: string
    description: string | null
    imageUrl: string | null
    quizType: $Enums.QuestionType
    tags: string[]
    statistics: JsonValue | null
    defaultSettings: JsonValue | null
    authorId: string
    createdAt: Date
    updatedAt: Date
    _count: QuizCountAggregateOutputType | null
    _min: QuizMinAggregateOutputType | null
    _max: QuizMaxAggregateOutputType | null
  }

  type GetQuizGroupByPayload<T extends QuizGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<QuizGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof QuizGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], QuizGroupByOutputType[P]>
            : GetScalarType<T[P], QuizGroupByOutputType[P]>
        }
      >
    >


  export type QuizSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    description?: boolean
    imageUrl?: boolean
    quizType?: boolean
    tags?: boolean
    statistics?: boolean
    defaultSettings?: boolean
    authorId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    questions?: boolean | Quiz$questionsArgs<ExtArgs>
    likes?: boolean | Quiz$likesArgs<ExtArgs>
    favorites?: boolean | Quiz$favoritesArgs<ExtArgs>
    _count?: boolean | QuizCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["quiz"]>

  export type QuizSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    description?: boolean
    imageUrl?: boolean
    quizType?: boolean
    tags?: boolean
    statistics?: boolean
    defaultSettings?: boolean
    authorId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["quiz"]>

  export type QuizSelectScalar = {
    id?: boolean
    title?: boolean
    description?: boolean
    imageUrl?: boolean
    quizType?: boolean
    tags?: boolean
    statistics?: boolean
    defaultSettings?: boolean
    authorId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type QuizInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    questions?: boolean | Quiz$questionsArgs<ExtArgs>
    likes?: boolean | Quiz$likesArgs<ExtArgs>
    favorites?: boolean | Quiz$favoritesArgs<ExtArgs>
    _count?: boolean | QuizCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type QuizIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $QuizPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Quiz"
    objects: {
      questions: Prisma.$QuestionPayload<ExtArgs>[]
      likes: Prisma.$QuizLikePayload<ExtArgs>[]
      favorites: Prisma.$QuizFavoritePayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      title: string
      description: string | null
      imageUrl: string | null
      quizType: $Enums.QuestionType
      tags: string[]
      statistics: Prisma.JsonValue | null
      defaultSettings: Prisma.JsonValue | null
      authorId: string
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["quiz"]>
    composites: {}
  }

  type QuizGetPayload<S extends boolean | null | undefined | QuizDefaultArgs> = $Result.GetResult<Prisma.$QuizPayload, S>

  type QuizCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<QuizFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: QuizCountAggregateInputType | true
    }

  export interface QuizDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Quiz'], meta: { name: 'Quiz' } }
    /**
     * Find zero or one Quiz that matches the filter.
     * @param {QuizFindUniqueArgs} args - Arguments to find a Quiz
     * @example
     * // Get one Quiz
     * const quiz = await prisma.quiz.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends QuizFindUniqueArgs>(args: SelectSubset<T, QuizFindUniqueArgs<ExtArgs>>): Prisma__QuizClient<$Result.GetResult<Prisma.$QuizPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Quiz that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {QuizFindUniqueOrThrowArgs} args - Arguments to find a Quiz
     * @example
     * // Get one Quiz
     * const quiz = await prisma.quiz.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends QuizFindUniqueOrThrowArgs>(args: SelectSubset<T, QuizFindUniqueOrThrowArgs<ExtArgs>>): Prisma__QuizClient<$Result.GetResult<Prisma.$QuizPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Quiz that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuizFindFirstArgs} args - Arguments to find a Quiz
     * @example
     * // Get one Quiz
     * const quiz = await prisma.quiz.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends QuizFindFirstArgs>(args?: SelectSubset<T, QuizFindFirstArgs<ExtArgs>>): Prisma__QuizClient<$Result.GetResult<Prisma.$QuizPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Quiz that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuizFindFirstOrThrowArgs} args - Arguments to find a Quiz
     * @example
     * // Get one Quiz
     * const quiz = await prisma.quiz.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends QuizFindFirstOrThrowArgs>(args?: SelectSubset<T, QuizFindFirstOrThrowArgs<ExtArgs>>): Prisma__QuizClient<$Result.GetResult<Prisma.$QuizPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Quizzes that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuizFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Quizzes
     * const quizzes = await prisma.quiz.findMany()
     * 
     * // Get first 10 Quizzes
     * const quizzes = await prisma.quiz.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const quizWithIdOnly = await prisma.quiz.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends QuizFindManyArgs>(args?: SelectSubset<T, QuizFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QuizPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Quiz.
     * @param {QuizCreateArgs} args - Arguments to create a Quiz.
     * @example
     * // Create one Quiz
     * const Quiz = await prisma.quiz.create({
     *   data: {
     *     // ... data to create a Quiz
     *   }
     * })
     * 
     */
    create<T extends QuizCreateArgs>(args: SelectSubset<T, QuizCreateArgs<ExtArgs>>): Prisma__QuizClient<$Result.GetResult<Prisma.$QuizPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Quizzes.
     * @param {QuizCreateManyArgs} args - Arguments to create many Quizzes.
     * @example
     * // Create many Quizzes
     * const quiz = await prisma.quiz.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends QuizCreateManyArgs>(args?: SelectSubset<T, QuizCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Quizzes and returns the data saved in the database.
     * @param {QuizCreateManyAndReturnArgs} args - Arguments to create many Quizzes.
     * @example
     * // Create many Quizzes
     * const quiz = await prisma.quiz.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Quizzes and only return the `id`
     * const quizWithIdOnly = await prisma.quiz.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends QuizCreateManyAndReturnArgs>(args?: SelectSubset<T, QuizCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QuizPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Quiz.
     * @param {QuizDeleteArgs} args - Arguments to delete one Quiz.
     * @example
     * // Delete one Quiz
     * const Quiz = await prisma.quiz.delete({
     *   where: {
     *     // ... filter to delete one Quiz
     *   }
     * })
     * 
     */
    delete<T extends QuizDeleteArgs>(args: SelectSubset<T, QuizDeleteArgs<ExtArgs>>): Prisma__QuizClient<$Result.GetResult<Prisma.$QuizPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Quiz.
     * @param {QuizUpdateArgs} args - Arguments to update one Quiz.
     * @example
     * // Update one Quiz
     * const quiz = await prisma.quiz.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends QuizUpdateArgs>(args: SelectSubset<T, QuizUpdateArgs<ExtArgs>>): Prisma__QuizClient<$Result.GetResult<Prisma.$QuizPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Quizzes.
     * @param {QuizDeleteManyArgs} args - Arguments to filter Quizzes to delete.
     * @example
     * // Delete a few Quizzes
     * const { count } = await prisma.quiz.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends QuizDeleteManyArgs>(args?: SelectSubset<T, QuizDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Quizzes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuizUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Quizzes
     * const quiz = await prisma.quiz.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends QuizUpdateManyArgs>(args: SelectSubset<T, QuizUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Quiz.
     * @param {QuizUpsertArgs} args - Arguments to update or create a Quiz.
     * @example
     * // Update or create a Quiz
     * const quiz = await prisma.quiz.upsert({
     *   create: {
     *     // ... data to create a Quiz
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Quiz we want to update
     *   }
     * })
     */
    upsert<T extends QuizUpsertArgs>(args: SelectSubset<T, QuizUpsertArgs<ExtArgs>>): Prisma__QuizClient<$Result.GetResult<Prisma.$QuizPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Quizzes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuizCountArgs} args - Arguments to filter Quizzes to count.
     * @example
     * // Count the number of Quizzes
     * const count = await prisma.quiz.count({
     *   where: {
     *     // ... the filter for the Quizzes we want to count
     *   }
     * })
    **/
    count<T extends QuizCountArgs>(
      args?: Subset<T, QuizCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], QuizCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Quiz.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuizAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends QuizAggregateArgs>(args: Subset<T, QuizAggregateArgs>): Prisma.PrismaPromise<GetQuizAggregateType<T>>

    /**
     * Group by Quiz.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuizGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends QuizGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: QuizGroupByArgs['orderBy'] }
        : { orderBy?: QuizGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, QuizGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetQuizGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Quiz model
   */
  readonly fields: QuizFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Quiz.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__QuizClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    questions<T extends Quiz$questionsArgs<ExtArgs> = {}>(args?: Subset<T, Quiz$questionsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QuestionPayload<ExtArgs>, T, "findMany"> | Null>
    likes<T extends Quiz$likesArgs<ExtArgs> = {}>(args?: Subset<T, Quiz$likesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QuizLikePayload<ExtArgs>, T, "findMany"> | Null>
    favorites<T extends Quiz$favoritesArgs<ExtArgs> = {}>(args?: Subset<T, Quiz$favoritesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QuizFavoritePayload<ExtArgs>, T, "findMany"> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Quiz model
   */ 
  interface QuizFieldRefs {
    readonly id: FieldRef<"Quiz", 'String'>
    readonly title: FieldRef<"Quiz", 'String'>
    readonly description: FieldRef<"Quiz", 'String'>
    readonly imageUrl: FieldRef<"Quiz", 'String'>
    readonly quizType: FieldRef<"Quiz", 'QuestionType'>
    readonly tags: FieldRef<"Quiz", 'String[]'>
    readonly statistics: FieldRef<"Quiz", 'Json'>
    readonly defaultSettings: FieldRef<"Quiz", 'Json'>
    readonly authorId: FieldRef<"Quiz", 'String'>
    readonly createdAt: FieldRef<"Quiz", 'DateTime'>
    readonly updatedAt: FieldRef<"Quiz", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Quiz findUnique
   */
  export type QuizFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Quiz
     */
    select?: QuizSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuizInclude<ExtArgs> | null
    /**
     * Filter, which Quiz to fetch.
     */
    where: QuizWhereUniqueInput
  }

  /**
   * Quiz findUniqueOrThrow
   */
  export type QuizFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Quiz
     */
    select?: QuizSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuizInclude<ExtArgs> | null
    /**
     * Filter, which Quiz to fetch.
     */
    where: QuizWhereUniqueInput
  }

  /**
   * Quiz findFirst
   */
  export type QuizFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Quiz
     */
    select?: QuizSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuizInclude<ExtArgs> | null
    /**
     * Filter, which Quiz to fetch.
     */
    where?: QuizWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Quizzes to fetch.
     */
    orderBy?: QuizOrderByWithRelationInput | QuizOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Quizzes.
     */
    cursor?: QuizWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Quizzes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Quizzes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Quizzes.
     */
    distinct?: QuizScalarFieldEnum | QuizScalarFieldEnum[]
  }

  /**
   * Quiz findFirstOrThrow
   */
  export type QuizFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Quiz
     */
    select?: QuizSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuizInclude<ExtArgs> | null
    /**
     * Filter, which Quiz to fetch.
     */
    where?: QuizWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Quizzes to fetch.
     */
    orderBy?: QuizOrderByWithRelationInput | QuizOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Quizzes.
     */
    cursor?: QuizWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Quizzes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Quizzes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Quizzes.
     */
    distinct?: QuizScalarFieldEnum | QuizScalarFieldEnum[]
  }

  /**
   * Quiz findMany
   */
  export type QuizFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Quiz
     */
    select?: QuizSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuizInclude<ExtArgs> | null
    /**
     * Filter, which Quizzes to fetch.
     */
    where?: QuizWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Quizzes to fetch.
     */
    orderBy?: QuizOrderByWithRelationInput | QuizOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Quizzes.
     */
    cursor?: QuizWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Quizzes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Quizzes.
     */
    skip?: number
    distinct?: QuizScalarFieldEnum | QuizScalarFieldEnum[]
  }

  /**
   * Quiz create
   */
  export type QuizCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Quiz
     */
    select?: QuizSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuizInclude<ExtArgs> | null
    /**
     * The data needed to create a Quiz.
     */
    data: XOR<QuizCreateInput, QuizUncheckedCreateInput>
  }

  /**
   * Quiz createMany
   */
  export type QuizCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Quizzes.
     */
    data: QuizCreateManyInput | QuizCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Quiz createManyAndReturn
   */
  export type QuizCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Quiz
     */
    select?: QuizSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Quizzes.
     */
    data: QuizCreateManyInput | QuizCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Quiz update
   */
  export type QuizUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Quiz
     */
    select?: QuizSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuizInclude<ExtArgs> | null
    /**
     * The data needed to update a Quiz.
     */
    data: XOR<QuizUpdateInput, QuizUncheckedUpdateInput>
    /**
     * Choose, which Quiz to update.
     */
    where: QuizWhereUniqueInput
  }

  /**
   * Quiz updateMany
   */
  export type QuizUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Quizzes.
     */
    data: XOR<QuizUpdateManyMutationInput, QuizUncheckedUpdateManyInput>
    /**
     * Filter which Quizzes to update
     */
    where?: QuizWhereInput
  }

  /**
   * Quiz upsert
   */
  export type QuizUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Quiz
     */
    select?: QuizSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuizInclude<ExtArgs> | null
    /**
     * The filter to search for the Quiz to update in case it exists.
     */
    where: QuizWhereUniqueInput
    /**
     * In case the Quiz found by the `where` argument doesn't exist, create a new Quiz with this data.
     */
    create: XOR<QuizCreateInput, QuizUncheckedCreateInput>
    /**
     * In case the Quiz was found with the provided `where` argument, update it with this data.
     */
    update: XOR<QuizUpdateInput, QuizUncheckedUpdateInput>
  }

  /**
   * Quiz delete
   */
  export type QuizDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Quiz
     */
    select?: QuizSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuizInclude<ExtArgs> | null
    /**
     * Filter which Quiz to delete.
     */
    where: QuizWhereUniqueInput
  }

  /**
   * Quiz deleteMany
   */
  export type QuizDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Quizzes to delete
     */
    where?: QuizWhereInput
  }

  /**
   * Quiz.questions
   */
  export type Quiz$questionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Question
     */
    select?: QuestionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuestionInclude<ExtArgs> | null
    where?: QuestionWhereInput
    orderBy?: QuestionOrderByWithRelationInput | QuestionOrderByWithRelationInput[]
    cursor?: QuestionWhereUniqueInput
    take?: number
    skip?: number
    distinct?: QuestionScalarFieldEnum | QuestionScalarFieldEnum[]
  }

  /**
   * Quiz.likes
   */
  export type Quiz$likesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuizLike
     */
    select?: QuizLikeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuizLikeInclude<ExtArgs> | null
    where?: QuizLikeWhereInput
    orderBy?: QuizLikeOrderByWithRelationInput | QuizLikeOrderByWithRelationInput[]
    cursor?: QuizLikeWhereUniqueInput
    take?: number
    skip?: number
    distinct?: QuizLikeScalarFieldEnum | QuizLikeScalarFieldEnum[]
  }

  /**
   * Quiz.favorites
   */
  export type Quiz$favoritesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuizFavorite
     */
    select?: QuizFavoriteSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuizFavoriteInclude<ExtArgs> | null
    where?: QuizFavoriteWhereInput
    orderBy?: QuizFavoriteOrderByWithRelationInput | QuizFavoriteOrderByWithRelationInput[]
    cursor?: QuizFavoriteWhereUniqueInput
    take?: number
    skip?: number
    distinct?: QuizFavoriteScalarFieldEnum | QuizFavoriteScalarFieldEnum[]
  }

  /**
   * Quiz without action
   */
  export type QuizDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Quiz
     */
    select?: QuizSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuizInclude<ExtArgs> | null
  }


  /**
   * Model QuizLike
   */

  export type AggregateQuizLike = {
    _count: QuizLikeCountAggregateOutputType | null
    _min: QuizLikeMinAggregateOutputType | null
    _max: QuizLikeMaxAggregateOutputType | null
  }

  export type QuizLikeMinAggregateOutputType = {
    id: string | null
    quizId: string | null
    userId: string | null
    createdAt: Date | null
  }

  export type QuizLikeMaxAggregateOutputType = {
    id: string | null
    quizId: string | null
    userId: string | null
    createdAt: Date | null
  }

  export type QuizLikeCountAggregateOutputType = {
    id: number
    quizId: number
    userId: number
    createdAt: number
    _all: number
  }


  export type QuizLikeMinAggregateInputType = {
    id?: true
    quizId?: true
    userId?: true
    createdAt?: true
  }

  export type QuizLikeMaxAggregateInputType = {
    id?: true
    quizId?: true
    userId?: true
    createdAt?: true
  }

  export type QuizLikeCountAggregateInputType = {
    id?: true
    quizId?: true
    userId?: true
    createdAt?: true
    _all?: true
  }

  export type QuizLikeAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which QuizLike to aggregate.
     */
    where?: QuizLikeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of QuizLikes to fetch.
     */
    orderBy?: QuizLikeOrderByWithRelationInput | QuizLikeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: QuizLikeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` QuizLikes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` QuizLikes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned QuizLikes
    **/
    _count?: true | QuizLikeCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: QuizLikeMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: QuizLikeMaxAggregateInputType
  }

  export type GetQuizLikeAggregateType<T extends QuizLikeAggregateArgs> = {
        [P in keyof T & keyof AggregateQuizLike]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateQuizLike[P]>
      : GetScalarType<T[P], AggregateQuizLike[P]>
  }




  export type QuizLikeGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: QuizLikeWhereInput
    orderBy?: QuizLikeOrderByWithAggregationInput | QuizLikeOrderByWithAggregationInput[]
    by: QuizLikeScalarFieldEnum[] | QuizLikeScalarFieldEnum
    having?: QuizLikeScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: QuizLikeCountAggregateInputType | true
    _min?: QuizLikeMinAggregateInputType
    _max?: QuizLikeMaxAggregateInputType
  }

  export type QuizLikeGroupByOutputType = {
    id: string
    quizId: string
    userId: string
    createdAt: Date
    _count: QuizLikeCountAggregateOutputType | null
    _min: QuizLikeMinAggregateOutputType | null
    _max: QuizLikeMaxAggregateOutputType | null
  }

  type GetQuizLikeGroupByPayload<T extends QuizLikeGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<QuizLikeGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof QuizLikeGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], QuizLikeGroupByOutputType[P]>
            : GetScalarType<T[P], QuizLikeGroupByOutputType[P]>
        }
      >
    >


  export type QuizLikeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    quizId?: boolean
    userId?: boolean
    createdAt?: boolean
    quiz?: boolean | QuizDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["quizLike"]>

  export type QuizLikeSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    quizId?: boolean
    userId?: boolean
    createdAt?: boolean
    quiz?: boolean | QuizDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["quizLike"]>

  export type QuizLikeSelectScalar = {
    id?: boolean
    quizId?: boolean
    userId?: boolean
    createdAt?: boolean
  }

  export type QuizLikeInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    quiz?: boolean | QuizDefaultArgs<ExtArgs>
  }
  export type QuizLikeIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    quiz?: boolean | QuizDefaultArgs<ExtArgs>
  }

  export type $QuizLikePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "QuizLike"
    objects: {
      quiz: Prisma.$QuizPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      quizId: string
      userId: string
      createdAt: Date
    }, ExtArgs["result"]["quizLike"]>
    composites: {}
  }

  type QuizLikeGetPayload<S extends boolean | null | undefined | QuizLikeDefaultArgs> = $Result.GetResult<Prisma.$QuizLikePayload, S>

  type QuizLikeCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<QuizLikeFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: QuizLikeCountAggregateInputType | true
    }

  export interface QuizLikeDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['QuizLike'], meta: { name: 'QuizLike' } }
    /**
     * Find zero or one QuizLike that matches the filter.
     * @param {QuizLikeFindUniqueArgs} args - Arguments to find a QuizLike
     * @example
     * // Get one QuizLike
     * const quizLike = await prisma.quizLike.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends QuizLikeFindUniqueArgs>(args: SelectSubset<T, QuizLikeFindUniqueArgs<ExtArgs>>): Prisma__QuizLikeClient<$Result.GetResult<Prisma.$QuizLikePayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one QuizLike that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {QuizLikeFindUniqueOrThrowArgs} args - Arguments to find a QuizLike
     * @example
     * // Get one QuizLike
     * const quizLike = await prisma.quizLike.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends QuizLikeFindUniqueOrThrowArgs>(args: SelectSubset<T, QuizLikeFindUniqueOrThrowArgs<ExtArgs>>): Prisma__QuizLikeClient<$Result.GetResult<Prisma.$QuizLikePayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first QuizLike that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuizLikeFindFirstArgs} args - Arguments to find a QuizLike
     * @example
     * // Get one QuizLike
     * const quizLike = await prisma.quizLike.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends QuizLikeFindFirstArgs>(args?: SelectSubset<T, QuizLikeFindFirstArgs<ExtArgs>>): Prisma__QuizLikeClient<$Result.GetResult<Prisma.$QuizLikePayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first QuizLike that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuizLikeFindFirstOrThrowArgs} args - Arguments to find a QuizLike
     * @example
     * // Get one QuizLike
     * const quizLike = await prisma.quizLike.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends QuizLikeFindFirstOrThrowArgs>(args?: SelectSubset<T, QuizLikeFindFirstOrThrowArgs<ExtArgs>>): Prisma__QuizLikeClient<$Result.GetResult<Prisma.$QuizLikePayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more QuizLikes that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuizLikeFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all QuizLikes
     * const quizLikes = await prisma.quizLike.findMany()
     * 
     * // Get first 10 QuizLikes
     * const quizLikes = await prisma.quizLike.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const quizLikeWithIdOnly = await prisma.quizLike.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends QuizLikeFindManyArgs>(args?: SelectSubset<T, QuizLikeFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QuizLikePayload<ExtArgs>, T, "findMany">>

    /**
     * Create a QuizLike.
     * @param {QuizLikeCreateArgs} args - Arguments to create a QuizLike.
     * @example
     * // Create one QuizLike
     * const QuizLike = await prisma.quizLike.create({
     *   data: {
     *     // ... data to create a QuizLike
     *   }
     * })
     * 
     */
    create<T extends QuizLikeCreateArgs>(args: SelectSubset<T, QuizLikeCreateArgs<ExtArgs>>): Prisma__QuizLikeClient<$Result.GetResult<Prisma.$QuizLikePayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many QuizLikes.
     * @param {QuizLikeCreateManyArgs} args - Arguments to create many QuizLikes.
     * @example
     * // Create many QuizLikes
     * const quizLike = await prisma.quizLike.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends QuizLikeCreateManyArgs>(args?: SelectSubset<T, QuizLikeCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many QuizLikes and returns the data saved in the database.
     * @param {QuizLikeCreateManyAndReturnArgs} args - Arguments to create many QuizLikes.
     * @example
     * // Create many QuizLikes
     * const quizLike = await prisma.quizLike.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many QuizLikes and only return the `id`
     * const quizLikeWithIdOnly = await prisma.quizLike.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends QuizLikeCreateManyAndReturnArgs>(args?: SelectSubset<T, QuizLikeCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QuizLikePayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a QuizLike.
     * @param {QuizLikeDeleteArgs} args - Arguments to delete one QuizLike.
     * @example
     * // Delete one QuizLike
     * const QuizLike = await prisma.quizLike.delete({
     *   where: {
     *     // ... filter to delete one QuizLike
     *   }
     * })
     * 
     */
    delete<T extends QuizLikeDeleteArgs>(args: SelectSubset<T, QuizLikeDeleteArgs<ExtArgs>>): Prisma__QuizLikeClient<$Result.GetResult<Prisma.$QuizLikePayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one QuizLike.
     * @param {QuizLikeUpdateArgs} args - Arguments to update one QuizLike.
     * @example
     * // Update one QuizLike
     * const quizLike = await prisma.quizLike.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends QuizLikeUpdateArgs>(args: SelectSubset<T, QuizLikeUpdateArgs<ExtArgs>>): Prisma__QuizLikeClient<$Result.GetResult<Prisma.$QuizLikePayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more QuizLikes.
     * @param {QuizLikeDeleteManyArgs} args - Arguments to filter QuizLikes to delete.
     * @example
     * // Delete a few QuizLikes
     * const { count } = await prisma.quizLike.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends QuizLikeDeleteManyArgs>(args?: SelectSubset<T, QuizLikeDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more QuizLikes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuizLikeUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many QuizLikes
     * const quizLike = await prisma.quizLike.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends QuizLikeUpdateManyArgs>(args: SelectSubset<T, QuizLikeUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one QuizLike.
     * @param {QuizLikeUpsertArgs} args - Arguments to update or create a QuizLike.
     * @example
     * // Update or create a QuizLike
     * const quizLike = await prisma.quizLike.upsert({
     *   create: {
     *     // ... data to create a QuizLike
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the QuizLike we want to update
     *   }
     * })
     */
    upsert<T extends QuizLikeUpsertArgs>(args: SelectSubset<T, QuizLikeUpsertArgs<ExtArgs>>): Prisma__QuizLikeClient<$Result.GetResult<Prisma.$QuizLikePayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of QuizLikes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuizLikeCountArgs} args - Arguments to filter QuizLikes to count.
     * @example
     * // Count the number of QuizLikes
     * const count = await prisma.quizLike.count({
     *   where: {
     *     // ... the filter for the QuizLikes we want to count
     *   }
     * })
    **/
    count<T extends QuizLikeCountArgs>(
      args?: Subset<T, QuizLikeCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], QuizLikeCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a QuizLike.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuizLikeAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends QuizLikeAggregateArgs>(args: Subset<T, QuizLikeAggregateArgs>): Prisma.PrismaPromise<GetQuizLikeAggregateType<T>>

    /**
     * Group by QuizLike.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuizLikeGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends QuizLikeGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: QuizLikeGroupByArgs['orderBy'] }
        : { orderBy?: QuizLikeGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, QuizLikeGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetQuizLikeGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the QuizLike model
   */
  readonly fields: QuizLikeFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for QuizLike.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__QuizLikeClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    quiz<T extends QuizDefaultArgs<ExtArgs> = {}>(args?: Subset<T, QuizDefaultArgs<ExtArgs>>): Prisma__QuizClient<$Result.GetResult<Prisma.$QuizPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the QuizLike model
   */ 
  interface QuizLikeFieldRefs {
    readonly id: FieldRef<"QuizLike", 'String'>
    readonly quizId: FieldRef<"QuizLike", 'String'>
    readonly userId: FieldRef<"QuizLike", 'String'>
    readonly createdAt: FieldRef<"QuizLike", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * QuizLike findUnique
   */
  export type QuizLikeFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuizLike
     */
    select?: QuizLikeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuizLikeInclude<ExtArgs> | null
    /**
     * Filter, which QuizLike to fetch.
     */
    where: QuizLikeWhereUniqueInput
  }

  /**
   * QuizLike findUniqueOrThrow
   */
  export type QuizLikeFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuizLike
     */
    select?: QuizLikeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuizLikeInclude<ExtArgs> | null
    /**
     * Filter, which QuizLike to fetch.
     */
    where: QuizLikeWhereUniqueInput
  }

  /**
   * QuizLike findFirst
   */
  export type QuizLikeFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuizLike
     */
    select?: QuizLikeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuizLikeInclude<ExtArgs> | null
    /**
     * Filter, which QuizLike to fetch.
     */
    where?: QuizLikeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of QuizLikes to fetch.
     */
    orderBy?: QuizLikeOrderByWithRelationInput | QuizLikeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for QuizLikes.
     */
    cursor?: QuizLikeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` QuizLikes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` QuizLikes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of QuizLikes.
     */
    distinct?: QuizLikeScalarFieldEnum | QuizLikeScalarFieldEnum[]
  }

  /**
   * QuizLike findFirstOrThrow
   */
  export type QuizLikeFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuizLike
     */
    select?: QuizLikeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuizLikeInclude<ExtArgs> | null
    /**
     * Filter, which QuizLike to fetch.
     */
    where?: QuizLikeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of QuizLikes to fetch.
     */
    orderBy?: QuizLikeOrderByWithRelationInput | QuizLikeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for QuizLikes.
     */
    cursor?: QuizLikeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` QuizLikes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` QuizLikes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of QuizLikes.
     */
    distinct?: QuizLikeScalarFieldEnum | QuizLikeScalarFieldEnum[]
  }

  /**
   * QuizLike findMany
   */
  export type QuizLikeFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuizLike
     */
    select?: QuizLikeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuizLikeInclude<ExtArgs> | null
    /**
     * Filter, which QuizLikes to fetch.
     */
    where?: QuizLikeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of QuizLikes to fetch.
     */
    orderBy?: QuizLikeOrderByWithRelationInput | QuizLikeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing QuizLikes.
     */
    cursor?: QuizLikeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` QuizLikes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` QuizLikes.
     */
    skip?: number
    distinct?: QuizLikeScalarFieldEnum | QuizLikeScalarFieldEnum[]
  }

  /**
   * QuizLike create
   */
  export type QuizLikeCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuizLike
     */
    select?: QuizLikeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuizLikeInclude<ExtArgs> | null
    /**
     * The data needed to create a QuizLike.
     */
    data: XOR<QuizLikeCreateInput, QuizLikeUncheckedCreateInput>
  }

  /**
   * QuizLike createMany
   */
  export type QuizLikeCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many QuizLikes.
     */
    data: QuizLikeCreateManyInput | QuizLikeCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * QuizLike createManyAndReturn
   */
  export type QuizLikeCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuizLike
     */
    select?: QuizLikeSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many QuizLikes.
     */
    data: QuizLikeCreateManyInput | QuizLikeCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuizLikeIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * QuizLike update
   */
  export type QuizLikeUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuizLike
     */
    select?: QuizLikeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuizLikeInclude<ExtArgs> | null
    /**
     * The data needed to update a QuizLike.
     */
    data: XOR<QuizLikeUpdateInput, QuizLikeUncheckedUpdateInput>
    /**
     * Choose, which QuizLike to update.
     */
    where: QuizLikeWhereUniqueInput
  }

  /**
   * QuizLike updateMany
   */
  export type QuizLikeUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update QuizLikes.
     */
    data: XOR<QuizLikeUpdateManyMutationInput, QuizLikeUncheckedUpdateManyInput>
    /**
     * Filter which QuizLikes to update
     */
    where?: QuizLikeWhereInput
  }

  /**
   * QuizLike upsert
   */
  export type QuizLikeUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuizLike
     */
    select?: QuizLikeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuizLikeInclude<ExtArgs> | null
    /**
     * The filter to search for the QuizLike to update in case it exists.
     */
    where: QuizLikeWhereUniqueInput
    /**
     * In case the QuizLike found by the `where` argument doesn't exist, create a new QuizLike with this data.
     */
    create: XOR<QuizLikeCreateInput, QuizLikeUncheckedCreateInput>
    /**
     * In case the QuizLike was found with the provided `where` argument, update it with this data.
     */
    update: XOR<QuizLikeUpdateInput, QuizLikeUncheckedUpdateInput>
  }

  /**
   * QuizLike delete
   */
  export type QuizLikeDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuizLike
     */
    select?: QuizLikeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuizLikeInclude<ExtArgs> | null
    /**
     * Filter which QuizLike to delete.
     */
    where: QuizLikeWhereUniqueInput
  }

  /**
   * QuizLike deleteMany
   */
  export type QuizLikeDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which QuizLikes to delete
     */
    where?: QuizLikeWhereInput
  }

  /**
   * QuizLike without action
   */
  export type QuizLikeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuizLike
     */
    select?: QuizLikeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuizLikeInclude<ExtArgs> | null
  }


  /**
   * Model QuizFavorite
   */

  export type AggregateQuizFavorite = {
    _count: QuizFavoriteCountAggregateOutputType | null
    _min: QuizFavoriteMinAggregateOutputType | null
    _max: QuizFavoriteMaxAggregateOutputType | null
  }

  export type QuizFavoriteMinAggregateOutputType = {
    id: string | null
    quizId: string | null
    userId: string | null
    createdAt: Date | null
  }

  export type QuizFavoriteMaxAggregateOutputType = {
    id: string | null
    quizId: string | null
    userId: string | null
    createdAt: Date | null
  }

  export type QuizFavoriteCountAggregateOutputType = {
    id: number
    quizId: number
    userId: number
    createdAt: number
    _all: number
  }


  export type QuizFavoriteMinAggregateInputType = {
    id?: true
    quizId?: true
    userId?: true
    createdAt?: true
  }

  export type QuizFavoriteMaxAggregateInputType = {
    id?: true
    quizId?: true
    userId?: true
    createdAt?: true
  }

  export type QuizFavoriteCountAggregateInputType = {
    id?: true
    quizId?: true
    userId?: true
    createdAt?: true
    _all?: true
  }

  export type QuizFavoriteAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which QuizFavorite to aggregate.
     */
    where?: QuizFavoriteWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of QuizFavorites to fetch.
     */
    orderBy?: QuizFavoriteOrderByWithRelationInput | QuizFavoriteOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: QuizFavoriteWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` QuizFavorites from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` QuizFavorites.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned QuizFavorites
    **/
    _count?: true | QuizFavoriteCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: QuizFavoriteMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: QuizFavoriteMaxAggregateInputType
  }

  export type GetQuizFavoriteAggregateType<T extends QuizFavoriteAggregateArgs> = {
        [P in keyof T & keyof AggregateQuizFavorite]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateQuizFavorite[P]>
      : GetScalarType<T[P], AggregateQuizFavorite[P]>
  }




  export type QuizFavoriteGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: QuizFavoriteWhereInput
    orderBy?: QuizFavoriteOrderByWithAggregationInput | QuizFavoriteOrderByWithAggregationInput[]
    by: QuizFavoriteScalarFieldEnum[] | QuizFavoriteScalarFieldEnum
    having?: QuizFavoriteScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: QuizFavoriteCountAggregateInputType | true
    _min?: QuizFavoriteMinAggregateInputType
    _max?: QuizFavoriteMaxAggregateInputType
  }

  export type QuizFavoriteGroupByOutputType = {
    id: string
    quizId: string
    userId: string
    createdAt: Date
    _count: QuizFavoriteCountAggregateOutputType | null
    _min: QuizFavoriteMinAggregateOutputType | null
    _max: QuizFavoriteMaxAggregateOutputType | null
  }

  type GetQuizFavoriteGroupByPayload<T extends QuizFavoriteGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<QuizFavoriteGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof QuizFavoriteGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], QuizFavoriteGroupByOutputType[P]>
            : GetScalarType<T[P], QuizFavoriteGroupByOutputType[P]>
        }
      >
    >


  export type QuizFavoriteSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    quizId?: boolean
    userId?: boolean
    createdAt?: boolean
    quiz?: boolean | QuizDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["quizFavorite"]>

  export type QuizFavoriteSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    quizId?: boolean
    userId?: boolean
    createdAt?: boolean
    quiz?: boolean | QuizDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["quizFavorite"]>

  export type QuizFavoriteSelectScalar = {
    id?: boolean
    quizId?: boolean
    userId?: boolean
    createdAt?: boolean
  }

  export type QuizFavoriteInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    quiz?: boolean | QuizDefaultArgs<ExtArgs>
  }
  export type QuizFavoriteIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    quiz?: boolean | QuizDefaultArgs<ExtArgs>
  }

  export type $QuizFavoritePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "QuizFavorite"
    objects: {
      quiz: Prisma.$QuizPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      quizId: string
      userId: string
      createdAt: Date
    }, ExtArgs["result"]["quizFavorite"]>
    composites: {}
  }

  type QuizFavoriteGetPayload<S extends boolean | null | undefined | QuizFavoriteDefaultArgs> = $Result.GetResult<Prisma.$QuizFavoritePayload, S>

  type QuizFavoriteCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<QuizFavoriteFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: QuizFavoriteCountAggregateInputType | true
    }

  export interface QuizFavoriteDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['QuizFavorite'], meta: { name: 'QuizFavorite' } }
    /**
     * Find zero or one QuizFavorite that matches the filter.
     * @param {QuizFavoriteFindUniqueArgs} args - Arguments to find a QuizFavorite
     * @example
     * // Get one QuizFavorite
     * const quizFavorite = await prisma.quizFavorite.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends QuizFavoriteFindUniqueArgs>(args: SelectSubset<T, QuizFavoriteFindUniqueArgs<ExtArgs>>): Prisma__QuizFavoriteClient<$Result.GetResult<Prisma.$QuizFavoritePayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one QuizFavorite that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {QuizFavoriteFindUniqueOrThrowArgs} args - Arguments to find a QuizFavorite
     * @example
     * // Get one QuizFavorite
     * const quizFavorite = await prisma.quizFavorite.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends QuizFavoriteFindUniqueOrThrowArgs>(args: SelectSubset<T, QuizFavoriteFindUniqueOrThrowArgs<ExtArgs>>): Prisma__QuizFavoriteClient<$Result.GetResult<Prisma.$QuizFavoritePayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first QuizFavorite that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuizFavoriteFindFirstArgs} args - Arguments to find a QuizFavorite
     * @example
     * // Get one QuizFavorite
     * const quizFavorite = await prisma.quizFavorite.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends QuizFavoriteFindFirstArgs>(args?: SelectSubset<T, QuizFavoriteFindFirstArgs<ExtArgs>>): Prisma__QuizFavoriteClient<$Result.GetResult<Prisma.$QuizFavoritePayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first QuizFavorite that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuizFavoriteFindFirstOrThrowArgs} args - Arguments to find a QuizFavorite
     * @example
     * // Get one QuizFavorite
     * const quizFavorite = await prisma.quizFavorite.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends QuizFavoriteFindFirstOrThrowArgs>(args?: SelectSubset<T, QuizFavoriteFindFirstOrThrowArgs<ExtArgs>>): Prisma__QuizFavoriteClient<$Result.GetResult<Prisma.$QuizFavoritePayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more QuizFavorites that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuizFavoriteFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all QuizFavorites
     * const quizFavorites = await prisma.quizFavorite.findMany()
     * 
     * // Get first 10 QuizFavorites
     * const quizFavorites = await prisma.quizFavorite.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const quizFavoriteWithIdOnly = await prisma.quizFavorite.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends QuizFavoriteFindManyArgs>(args?: SelectSubset<T, QuizFavoriteFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QuizFavoritePayload<ExtArgs>, T, "findMany">>

    /**
     * Create a QuizFavorite.
     * @param {QuizFavoriteCreateArgs} args - Arguments to create a QuizFavorite.
     * @example
     * // Create one QuizFavorite
     * const QuizFavorite = await prisma.quizFavorite.create({
     *   data: {
     *     // ... data to create a QuizFavorite
     *   }
     * })
     * 
     */
    create<T extends QuizFavoriteCreateArgs>(args: SelectSubset<T, QuizFavoriteCreateArgs<ExtArgs>>): Prisma__QuizFavoriteClient<$Result.GetResult<Prisma.$QuizFavoritePayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many QuizFavorites.
     * @param {QuizFavoriteCreateManyArgs} args - Arguments to create many QuizFavorites.
     * @example
     * // Create many QuizFavorites
     * const quizFavorite = await prisma.quizFavorite.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends QuizFavoriteCreateManyArgs>(args?: SelectSubset<T, QuizFavoriteCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many QuizFavorites and returns the data saved in the database.
     * @param {QuizFavoriteCreateManyAndReturnArgs} args - Arguments to create many QuizFavorites.
     * @example
     * // Create many QuizFavorites
     * const quizFavorite = await prisma.quizFavorite.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many QuizFavorites and only return the `id`
     * const quizFavoriteWithIdOnly = await prisma.quizFavorite.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends QuizFavoriteCreateManyAndReturnArgs>(args?: SelectSubset<T, QuizFavoriteCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QuizFavoritePayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a QuizFavorite.
     * @param {QuizFavoriteDeleteArgs} args - Arguments to delete one QuizFavorite.
     * @example
     * // Delete one QuizFavorite
     * const QuizFavorite = await prisma.quizFavorite.delete({
     *   where: {
     *     // ... filter to delete one QuizFavorite
     *   }
     * })
     * 
     */
    delete<T extends QuizFavoriteDeleteArgs>(args: SelectSubset<T, QuizFavoriteDeleteArgs<ExtArgs>>): Prisma__QuizFavoriteClient<$Result.GetResult<Prisma.$QuizFavoritePayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one QuizFavorite.
     * @param {QuizFavoriteUpdateArgs} args - Arguments to update one QuizFavorite.
     * @example
     * // Update one QuizFavorite
     * const quizFavorite = await prisma.quizFavorite.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends QuizFavoriteUpdateArgs>(args: SelectSubset<T, QuizFavoriteUpdateArgs<ExtArgs>>): Prisma__QuizFavoriteClient<$Result.GetResult<Prisma.$QuizFavoritePayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more QuizFavorites.
     * @param {QuizFavoriteDeleteManyArgs} args - Arguments to filter QuizFavorites to delete.
     * @example
     * // Delete a few QuizFavorites
     * const { count } = await prisma.quizFavorite.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends QuizFavoriteDeleteManyArgs>(args?: SelectSubset<T, QuizFavoriteDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more QuizFavorites.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuizFavoriteUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many QuizFavorites
     * const quizFavorite = await prisma.quizFavorite.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends QuizFavoriteUpdateManyArgs>(args: SelectSubset<T, QuizFavoriteUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one QuizFavorite.
     * @param {QuizFavoriteUpsertArgs} args - Arguments to update or create a QuizFavorite.
     * @example
     * // Update or create a QuizFavorite
     * const quizFavorite = await prisma.quizFavorite.upsert({
     *   create: {
     *     // ... data to create a QuizFavorite
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the QuizFavorite we want to update
     *   }
     * })
     */
    upsert<T extends QuizFavoriteUpsertArgs>(args: SelectSubset<T, QuizFavoriteUpsertArgs<ExtArgs>>): Prisma__QuizFavoriteClient<$Result.GetResult<Prisma.$QuizFavoritePayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of QuizFavorites.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuizFavoriteCountArgs} args - Arguments to filter QuizFavorites to count.
     * @example
     * // Count the number of QuizFavorites
     * const count = await prisma.quizFavorite.count({
     *   where: {
     *     // ... the filter for the QuizFavorites we want to count
     *   }
     * })
    **/
    count<T extends QuizFavoriteCountArgs>(
      args?: Subset<T, QuizFavoriteCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], QuizFavoriteCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a QuizFavorite.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuizFavoriteAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends QuizFavoriteAggregateArgs>(args: Subset<T, QuizFavoriteAggregateArgs>): Prisma.PrismaPromise<GetQuizFavoriteAggregateType<T>>

    /**
     * Group by QuizFavorite.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuizFavoriteGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends QuizFavoriteGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: QuizFavoriteGroupByArgs['orderBy'] }
        : { orderBy?: QuizFavoriteGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, QuizFavoriteGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetQuizFavoriteGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the QuizFavorite model
   */
  readonly fields: QuizFavoriteFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for QuizFavorite.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__QuizFavoriteClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    quiz<T extends QuizDefaultArgs<ExtArgs> = {}>(args?: Subset<T, QuizDefaultArgs<ExtArgs>>): Prisma__QuizClient<$Result.GetResult<Prisma.$QuizPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the QuizFavorite model
   */ 
  interface QuizFavoriteFieldRefs {
    readonly id: FieldRef<"QuizFavorite", 'String'>
    readonly quizId: FieldRef<"QuizFavorite", 'String'>
    readonly userId: FieldRef<"QuizFavorite", 'String'>
    readonly createdAt: FieldRef<"QuizFavorite", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * QuizFavorite findUnique
   */
  export type QuizFavoriteFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuizFavorite
     */
    select?: QuizFavoriteSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuizFavoriteInclude<ExtArgs> | null
    /**
     * Filter, which QuizFavorite to fetch.
     */
    where: QuizFavoriteWhereUniqueInput
  }

  /**
   * QuizFavorite findUniqueOrThrow
   */
  export type QuizFavoriteFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuizFavorite
     */
    select?: QuizFavoriteSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuizFavoriteInclude<ExtArgs> | null
    /**
     * Filter, which QuizFavorite to fetch.
     */
    where: QuizFavoriteWhereUniqueInput
  }

  /**
   * QuizFavorite findFirst
   */
  export type QuizFavoriteFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuizFavorite
     */
    select?: QuizFavoriteSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuizFavoriteInclude<ExtArgs> | null
    /**
     * Filter, which QuizFavorite to fetch.
     */
    where?: QuizFavoriteWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of QuizFavorites to fetch.
     */
    orderBy?: QuizFavoriteOrderByWithRelationInput | QuizFavoriteOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for QuizFavorites.
     */
    cursor?: QuizFavoriteWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` QuizFavorites from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` QuizFavorites.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of QuizFavorites.
     */
    distinct?: QuizFavoriteScalarFieldEnum | QuizFavoriteScalarFieldEnum[]
  }

  /**
   * QuizFavorite findFirstOrThrow
   */
  export type QuizFavoriteFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuizFavorite
     */
    select?: QuizFavoriteSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuizFavoriteInclude<ExtArgs> | null
    /**
     * Filter, which QuizFavorite to fetch.
     */
    where?: QuizFavoriteWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of QuizFavorites to fetch.
     */
    orderBy?: QuizFavoriteOrderByWithRelationInput | QuizFavoriteOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for QuizFavorites.
     */
    cursor?: QuizFavoriteWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` QuizFavorites from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` QuizFavorites.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of QuizFavorites.
     */
    distinct?: QuizFavoriteScalarFieldEnum | QuizFavoriteScalarFieldEnum[]
  }

  /**
   * QuizFavorite findMany
   */
  export type QuizFavoriteFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuizFavorite
     */
    select?: QuizFavoriteSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuizFavoriteInclude<ExtArgs> | null
    /**
     * Filter, which QuizFavorites to fetch.
     */
    where?: QuizFavoriteWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of QuizFavorites to fetch.
     */
    orderBy?: QuizFavoriteOrderByWithRelationInput | QuizFavoriteOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing QuizFavorites.
     */
    cursor?: QuizFavoriteWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` QuizFavorites from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` QuizFavorites.
     */
    skip?: number
    distinct?: QuizFavoriteScalarFieldEnum | QuizFavoriteScalarFieldEnum[]
  }

  /**
   * QuizFavorite create
   */
  export type QuizFavoriteCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuizFavorite
     */
    select?: QuizFavoriteSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuizFavoriteInclude<ExtArgs> | null
    /**
     * The data needed to create a QuizFavorite.
     */
    data: XOR<QuizFavoriteCreateInput, QuizFavoriteUncheckedCreateInput>
  }

  /**
   * QuizFavorite createMany
   */
  export type QuizFavoriteCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many QuizFavorites.
     */
    data: QuizFavoriteCreateManyInput | QuizFavoriteCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * QuizFavorite createManyAndReturn
   */
  export type QuizFavoriteCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuizFavorite
     */
    select?: QuizFavoriteSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many QuizFavorites.
     */
    data: QuizFavoriteCreateManyInput | QuizFavoriteCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuizFavoriteIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * QuizFavorite update
   */
  export type QuizFavoriteUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuizFavorite
     */
    select?: QuizFavoriteSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuizFavoriteInclude<ExtArgs> | null
    /**
     * The data needed to update a QuizFavorite.
     */
    data: XOR<QuizFavoriteUpdateInput, QuizFavoriteUncheckedUpdateInput>
    /**
     * Choose, which QuizFavorite to update.
     */
    where: QuizFavoriteWhereUniqueInput
  }

  /**
   * QuizFavorite updateMany
   */
  export type QuizFavoriteUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update QuizFavorites.
     */
    data: XOR<QuizFavoriteUpdateManyMutationInput, QuizFavoriteUncheckedUpdateManyInput>
    /**
     * Filter which QuizFavorites to update
     */
    where?: QuizFavoriteWhereInput
  }

  /**
   * QuizFavorite upsert
   */
  export type QuizFavoriteUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuizFavorite
     */
    select?: QuizFavoriteSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuizFavoriteInclude<ExtArgs> | null
    /**
     * The filter to search for the QuizFavorite to update in case it exists.
     */
    where: QuizFavoriteWhereUniqueInput
    /**
     * In case the QuizFavorite found by the `where` argument doesn't exist, create a new QuizFavorite with this data.
     */
    create: XOR<QuizFavoriteCreateInput, QuizFavoriteUncheckedCreateInput>
    /**
     * In case the QuizFavorite was found with the provided `where` argument, update it with this data.
     */
    update: XOR<QuizFavoriteUpdateInput, QuizFavoriteUncheckedUpdateInput>
  }

  /**
   * QuizFavorite delete
   */
  export type QuizFavoriteDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuizFavorite
     */
    select?: QuizFavoriteSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuizFavoriteInclude<ExtArgs> | null
    /**
     * Filter which QuizFavorite to delete.
     */
    where: QuizFavoriteWhereUniqueInput
  }

  /**
   * QuizFavorite deleteMany
   */
  export type QuizFavoriteDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which QuizFavorites to delete
     */
    where?: QuizFavoriteWhereInput
  }

  /**
   * QuizFavorite without action
   */
  export type QuizFavoriteDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuizFavorite
     */
    select?: QuizFavoriteSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuizFavoriteInclude<ExtArgs> | null
  }


  /**
   * Model Question
   */

  export type AggregateQuestion = {
    _count: QuestionCountAggregateOutputType | null
    _min: QuestionMinAggregateOutputType | null
    _max: QuestionMaxAggregateOutputType | null
  }

  export type QuestionMinAggregateOutputType = {
    id: string | null
    question: string | null
    imageUrl: string | null
    correctAnswer: string | null
    type: $Enums.QuestionType | null
    quizId: string | null
  }

  export type QuestionMaxAggregateOutputType = {
    id: string | null
    question: string | null
    imageUrl: string | null
    correctAnswer: string | null
    type: $Enums.QuestionType | null
    quizId: string | null
  }

  export type QuestionCountAggregateOutputType = {
    id: number
    question: number
    imageUrl: number
    answers: number
    correctAnswer: number
    type: number
    quizId: number
    _all: number
  }


  export type QuestionMinAggregateInputType = {
    id?: true
    question?: true
    imageUrl?: true
    correctAnswer?: true
    type?: true
    quizId?: true
  }

  export type QuestionMaxAggregateInputType = {
    id?: true
    question?: true
    imageUrl?: true
    correctAnswer?: true
    type?: true
    quizId?: true
  }

  export type QuestionCountAggregateInputType = {
    id?: true
    question?: true
    imageUrl?: true
    answers?: true
    correctAnswer?: true
    type?: true
    quizId?: true
    _all?: true
  }

  export type QuestionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Question to aggregate.
     */
    where?: QuestionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Questions to fetch.
     */
    orderBy?: QuestionOrderByWithRelationInput | QuestionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: QuestionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Questions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Questions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Questions
    **/
    _count?: true | QuestionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: QuestionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: QuestionMaxAggregateInputType
  }

  export type GetQuestionAggregateType<T extends QuestionAggregateArgs> = {
        [P in keyof T & keyof AggregateQuestion]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateQuestion[P]>
      : GetScalarType<T[P], AggregateQuestion[P]>
  }




  export type QuestionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: QuestionWhereInput
    orderBy?: QuestionOrderByWithAggregationInput | QuestionOrderByWithAggregationInput[]
    by: QuestionScalarFieldEnum[] | QuestionScalarFieldEnum
    having?: QuestionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: QuestionCountAggregateInputType | true
    _min?: QuestionMinAggregateInputType
    _max?: QuestionMaxAggregateInputType
  }

  export type QuestionGroupByOutputType = {
    id: string
    question: string
    imageUrl: string | null
    answers: string[]
    correctAnswer: string
    type: $Enums.QuestionType
    quizId: string | null
    _count: QuestionCountAggregateOutputType | null
    _min: QuestionMinAggregateOutputType | null
    _max: QuestionMaxAggregateOutputType | null
  }

  type GetQuestionGroupByPayload<T extends QuestionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<QuestionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof QuestionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], QuestionGroupByOutputType[P]>
            : GetScalarType<T[P], QuestionGroupByOutputType[P]>
        }
      >
    >


  export type QuestionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    question?: boolean
    imageUrl?: boolean
    answers?: boolean
    correctAnswer?: boolean
    type?: boolean
    quizId?: boolean
    quiz?: boolean | Question$quizArgs<ExtArgs>
  }, ExtArgs["result"]["question"]>

  export type QuestionSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    question?: boolean
    imageUrl?: boolean
    answers?: boolean
    correctAnswer?: boolean
    type?: boolean
    quizId?: boolean
    quiz?: boolean | Question$quizArgs<ExtArgs>
  }, ExtArgs["result"]["question"]>

  export type QuestionSelectScalar = {
    id?: boolean
    question?: boolean
    imageUrl?: boolean
    answers?: boolean
    correctAnswer?: boolean
    type?: boolean
    quizId?: boolean
  }

  export type QuestionInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    quiz?: boolean | Question$quizArgs<ExtArgs>
  }
  export type QuestionIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    quiz?: boolean | Question$quizArgs<ExtArgs>
  }

  export type $QuestionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Question"
    objects: {
      quiz: Prisma.$QuizPayload<ExtArgs> | null
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      question: string
      imageUrl: string | null
      answers: string[]
      correctAnswer: string
      type: $Enums.QuestionType
      quizId: string | null
    }, ExtArgs["result"]["question"]>
    composites: {}
  }

  type QuestionGetPayload<S extends boolean | null | undefined | QuestionDefaultArgs> = $Result.GetResult<Prisma.$QuestionPayload, S>

  type QuestionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<QuestionFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: QuestionCountAggregateInputType | true
    }

  export interface QuestionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Question'], meta: { name: 'Question' } }
    /**
     * Find zero or one Question that matches the filter.
     * @param {QuestionFindUniqueArgs} args - Arguments to find a Question
     * @example
     * // Get one Question
     * const question = await prisma.question.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends QuestionFindUniqueArgs>(args: SelectSubset<T, QuestionFindUniqueArgs<ExtArgs>>): Prisma__QuestionClient<$Result.GetResult<Prisma.$QuestionPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Question that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {QuestionFindUniqueOrThrowArgs} args - Arguments to find a Question
     * @example
     * // Get one Question
     * const question = await prisma.question.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends QuestionFindUniqueOrThrowArgs>(args: SelectSubset<T, QuestionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__QuestionClient<$Result.GetResult<Prisma.$QuestionPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Question that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuestionFindFirstArgs} args - Arguments to find a Question
     * @example
     * // Get one Question
     * const question = await prisma.question.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends QuestionFindFirstArgs>(args?: SelectSubset<T, QuestionFindFirstArgs<ExtArgs>>): Prisma__QuestionClient<$Result.GetResult<Prisma.$QuestionPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Question that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuestionFindFirstOrThrowArgs} args - Arguments to find a Question
     * @example
     * // Get one Question
     * const question = await prisma.question.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends QuestionFindFirstOrThrowArgs>(args?: SelectSubset<T, QuestionFindFirstOrThrowArgs<ExtArgs>>): Prisma__QuestionClient<$Result.GetResult<Prisma.$QuestionPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Questions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuestionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Questions
     * const questions = await prisma.question.findMany()
     * 
     * // Get first 10 Questions
     * const questions = await prisma.question.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const questionWithIdOnly = await prisma.question.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends QuestionFindManyArgs>(args?: SelectSubset<T, QuestionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QuestionPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Question.
     * @param {QuestionCreateArgs} args - Arguments to create a Question.
     * @example
     * // Create one Question
     * const Question = await prisma.question.create({
     *   data: {
     *     // ... data to create a Question
     *   }
     * })
     * 
     */
    create<T extends QuestionCreateArgs>(args: SelectSubset<T, QuestionCreateArgs<ExtArgs>>): Prisma__QuestionClient<$Result.GetResult<Prisma.$QuestionPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Questions.
     * @param {QuestionCreateManyArgs} args - Arguments to create many Questions.
     * @example
     * // Create many Questions
     * const question = await prisma.question.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends QuestionCreateManyArgs>(args?: SelectSubset<T, QuestionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Questions and returns the data saved in the database.
     * @param {QuestionCreateManyAndReturnArgs} args - Arguments to create many Questions.
     * @example
     * // Create many Questions
     * const question = await prisma.question.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Questions and only return the `id`
     * const questionWithIdOnly = await prisma.question.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends QuestionCreateManyAndReturnArgs>(args?: SelectSubset<T, QuestionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QuestionPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Question.
     * @param {QuestionDeleteArgs} args - Arguments to delete one Question.
     * @example
     * // Delete one Question
     * const Question = await prisma.question.delete({
     *   where: {
     *     // ... filter to delete one Question
     *   }
     * })
     * 
     */
    delete<T extends QuestionDeleteArgs>(args: SelectSubset<T, QuestionDeleteArgs<ExtArgs>>): Prisma__QuestionClient<$Result.GetResult<Prisma.$QuestionPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Question.
     * @param {QuestionUpdateArgs} args - Arguments to update one Question.
     * @example
     * // Update one Question
     * const question = await prisma.question.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends QuestionUpdateArgs>(args: SelectSubset<T, QuestionUpdateArgs<ExtArgs>>): Prisma__QuestionClient<$Result.GetResult<Prisma.$QuestionPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Questions.
     * @param {QuestionDeleteManyArgs} args - Arguments to filter Questions to delete.
     * @example
     * // Delete a few Questions
     * const { count } = await prisma.question.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends QuestionDeleteManyArgs>(args?: SelectSubset<T, QuestionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Questions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuestionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Questions
     * const question = await prisma.question.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends QuestionUpdateManyArgs>(args: SelectSubset<T, QuestionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Question.
     * @param {QuestionUpsertArgs} args - Arguments to update or create a Question.
     * @example
     * // Update or create a Question
     * const question = await prisma.question.upsert({
     *   create: {
     *     // ... data to create a Question
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Question we want to update
     *   }
     * })
     */
    upsert<T extends QuestionUpsertArgs>(args: SelectSubset<T, QuestionUpsertArgs<ExtArgs>>): Prisma__QuestionClient<$Result.GetResult<Prisma.$QuestionPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Questions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuestionCountArgs} args - Arguments to filter Questions to count.
     * @example
     * // Count the number of Questions
     * const count = await prisma.question.count({
     *   where: {
     *     // ... the filter for the Questions we want to count
     *   }
     * })
    **/
    count<T extends QuestionCountArgs>(
      args?: Subset<T, QuestionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], QuestionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Question.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuestionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends QuestionAggregateArgs>(args: Subset<T, QuestionAggregateArgs>): Prisma.PrismaPromise<GetQuestionAggregateType<T>>

    /**
     * Group by Question.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuestionGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends QuestionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: QuestionGroupByArgs['orderBy'] }
        : { orderBy?: QuestionGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, QuestionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetQuestionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Question model
   */
  readonly fields: QuestionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Question.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__QuestionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    quiz<T extends Question$quizArgs<ExtArgs> = {}>(args?: Subset<T, Question$quizArgs<ExtArgs>>): Prisma__QuizClient<$Result.GetResult<Prisma.$QuizPayload<ExtArgs>, T, "findUniqueOrThrow"> | null, null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Question model
   */ 
  interface QuestionFieldRefs {
    readonly id: FieldRef<"Question", 'String'>
    readonly question: FieldRef<"Question", 'String'>
    readonly imageUrl: FieldRef<"Question", 'String'>
    readonly answers: FieldRef<"Question", 'String[]'>
    readonly correctAnswer: FieldRef<"Question", 'String'>
    readonly type: FieldRef<"Question", 'QuestionType'>
    readonly quizId: FieldRef<"Question", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Question findUnique
   */
  export type QuestionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Question
     */
    select?: QuestionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuestionInclude<ExtArgs> | null
    /**
     * Filter, which Question to fetch.
     */
    where: QuestionWhereUniqueInput
  }

  /**
   * Question findUniqueOrThrow
   */
  export type QuestionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Question
     */
    select?: QuestionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuestionInclude<ExtArgs> | null
    /**
     * Filter, which Question to fetch.
     */
    where: QuestionWhereUniqueInput
  }

  /**
   * Question findFirst
   */
  export type QuestionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Question
     */
    select?: QuestionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuestionInclude<ExtArgs> | null
    /**
     * Filter, which Question to fetch.
     */
    where?: QuestionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Questions to fetch.
     */
    orderBy?: QuestionOrderByWithRelationInput | QuestionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Questions.
     */
    cursor?: QuestionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Questions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Questions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Questions.
     */
    distinct?: QuestionScalarFieldEnum | QuestionScalarFieldEnum[]
  }

  /**
   * Question findFirstOrThrow
   */
  export type QuestionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Question
     */
    select?: QuestionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuestionInclude<ExtArgs> | null
    /**
     * Filter, which Question to fetch.
     */
    where?: QuestionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Questions to fetch.
     */
    orderBy?: QuestionOrderByWithRelationInput | QuestionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Questions.
     */
    cursor?: QuestionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Questions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Questions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Questions.
     */
    distinct?: QuestionScalarFieldEnum | QuestionScalarFieldEnum[]
  }

  /**
   * Question findMany
   */
  export type QuestionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Question
     */
    select?: QuestionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuestionInclude<ExtArgs> | null
    /**
     * Filter, which Questions to fetch.
     */
    where?: QuestionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Questions to fetch.
     */
    orderBy?: QuestionOrderByWithRelationInput | QuestionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Questions.
     */
    cursor?: QuestionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Questions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Questions.
     */
    skip?: number
    distinct?: QuestionScalarFieldEnum | QuestionScalarFieldEnum[]
  }

  /**
   * Question create
   */
  export type QuestionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Question
     */
    select?: QuestionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuestionInclude<ExtArgs> | null
    /**
     * The data needed to create a Question.
     */
    data: XOR<QuestionCreateInput, QuestionUncheckedCreateInput>
  }

  /**
   * Question createMany
   */
  export type QuestionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Questions.
     */
    data: QuestionCreateManyInput | QuestionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Question createManyAndReturn
   */
  export type QuestionCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Question
     */
    select?: QuestionSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Questions.
     */
    data: QuestionCreateManyInput | QuestionCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuestionIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Question update
   */
  export type QuestionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Question
     */
    select?: QuestionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuestionInclude<ExtArgs> | null
    /**
     * The data needed to update a Question.
     */
    data: XOR<QuestionUpdateInput, QuestionUncheckedUpdateInput>
    /**
     * Choose, which Question to update.
     */
    where: QuestionWhereUniqueInput
  }

  /**
   * Question updateMany
   */
  export type QuestionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Questions.
     */
    data: XOR<QuestionUpdateManyMutationInput, QuestionUncheckedUpdateManyInput>
    /**
     * Filter which Questions to update
     */
    where?: QuestionWhereInput
  }

  /**
   * Question upsert
   */
  export type QuestionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Question
     */
    select?: QuestionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuestionInclude<ExtArgs> | null
    /**
     * The filter to search for the Question to update in case it exists.
     */
    where: QuestionWhereUniqueInput
    /**
     * In case the Question found by the `where` argument doesn't exist, create a new Question with this data.
     */
    create: XOR<QuestionCreateInput, QuestionUncheckedCreateInput>
    /**
     * In case the Question was found with the provided `where` argument, update it with this data.
     */
    update: XOR<QuestionUpdateInput, QuestionUncheckedUpdateInput>
  }

  /**
   * Question delete
   */
  export type QuestionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Question
     */
    select?: QuestionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuestionInclude<ExtArgs> | null
    /**
     * Filter which Question to delete.
     */
    where: QuestionWhereUniqueInput
  }

  /**
   * Question deleteMany
   */
  export type QuestionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Questions to delete
     */
    where?: QuestionWhereInput
  }

  /**
   * Question.quiz
   */
  export type Question$quizArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Quiz
     */
    select?: QuizSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuizInclude<ExtArgs> | null
    where?: QuizWhereInput
  }

  /**
   * Question without action
   */
  export type QuestionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Question
     */
    select?: QuestionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuestionInclude<ExtArgs> | null
  }


  /**
   * Model StoredImage
   */

  export type AggregateStoredImage = {
    _count: StoredImageCountAggregateOutputType | null
    _avg: StoredImageAvgAggregateOutputType | null
    _sum: StoredImageSumAggregateOutputType | null
    _min: StoredImageMinAggregateOutputType | null
    _max: StoredImageMaxAggregateOutputType | null
  }

  export type StoredImageAvgAggregateOutputType = {
    fileSize: number | null
    width: number | null
    height: number | null
    pixabayId: number | null
    usageCount: number | null
  }

  export type StoredImageSumAggregateOutputType = {
    fileSize: number | null
    width: number | null
    height: number | null
    pixabayId: number | null
    usageCount: number | null
  }

  export type StoredImageMinAggregateOutputType = {
    id: string | null
    filename: string | null
    originalUrl: string | null
    blobUrl: string | null
    mimeType: string | null
    fileSize: number | null
    width: number | null
    height: number | null
    searchTerm: string | null
    pixabayId: number | null
    pixabayUser: string | null
    usageCount: number | null
    lastUsedAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type StoredImageMaxAggregateOutputType = {
    id: string | null
    filename: string | null
    originalUrl: string | null
    blobUrl: string | null
    mimeType: string | null
    fileSize: number | null
    width: number | null
    height: number | null
    searchTerm: string | null
    pixabayId: number | null
    pixabayUser: string | null
    usageCount: number | null
    lastUsedAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type StoredImageCountAggregateOutputType = {
    id: number
    filename: number
    originalUrl: number
    blobUrl: number
    mimeType: number
    fileSize: number
    width: number
    height: number
    searchTerm: number
    tags: number
    pixabayId: number
    pixabayUser: number
    usageCount: number
    lastUsedAt: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type StoredImageAvgAggregateInputType = {
    fileSize?: true
    width?: true
    height?: true
    pixabayId?: true
    usageCount?: true
  }

  export type StoredImageSumAggregateInputType = {
    fileSize?: true
    width?: true
    height?: true
    pixabayId?: true
    usageCount?: true
  }

  export type StoredImageMinAggregateInputType = {
    id?: true
    filename?: true
    originalUrl?: true
    blobUrl?: true
    mimeType?: true
    fileSize?: true
    width?: true
    height?: true
    searchTerm?: true
    pixabayId?: true
    pixabayUser?: true
    usageCount?: true
    lastUsedAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type StoredImageMaxAggregateInputType = {
    id?: true
    filename?: true
    originalUrl?: true
    blobUrl?: true
    mimeType?: true
    fileSize?: true
    width?: true
    height?: true
    searchTerm?: true
    pixabayId?: true
    pixabayUser?: true
    usageCount?: true
    lastUsedAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type StoredImageCountAggregateInputType = {
    id?: true
    filename?: true
    originalUrl?: true
    blobUrl?: true
    mimeType?: true
    fileSize?: true
    width?: true
    height?: true
    searchTerm?: true
    tags?: true
    pixabayId?: true
    pixabayUser?: true
    usageCount?: true
    lastUsedAt?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type StoredImageAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which StoredImage to aggregate.
     */
    where?: StoredImageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of StoredImages to fetch.
     */
    orderBy?: StoredImageOrderByWithRelationInput | StoredImageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: StoredImageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` StoredImages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` StoredImages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned StoredImages
    **/
    _count?: true | StoredImageCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: StoredImageAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: StoredImageSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: StoredImageMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: StoredImageMaxAggregateInputType
  }

  export type GetStoredImageAggregateType<T extends StoredImageAggregateArgs> = {
        [P in keyof T & keyof AggregateStoredImage]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateStoredImage[P]>
      : GetScalarType<T[P], AggregateStoredImage[P]>
  }




  export type StoredImageGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: StoredImageWhereInput
    orderBy?: StoredImageOrderByWithAggregationInput | StoredImageOrderByWithAggregationInput[]
    by: StoredImageScalarFieldEnum[] | StoredImageScalarFieldEnum
    having?: StoredImageScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: StoredImageCountAggregateInputType | true
    _avg?: StoredImageAvgAggregateInputType
    _sum?: StoredImageSumAggregateInputType
    _min?: StoredImageMinAggregateInputType
    _max?: StoredImageMaxAggregateInputType
  }

  export type StoredImageGroupByOutputType = {
    id: string
    filename: string
    originalUrl: string
    blobUrl: string
    mimeType: string
    fileSize: number
    width: number
    height: number
    searchTerm: string | null
    tags: string[]
    pixabayId: number
    pixabayUser: string | null
    usageCount: number
    lastUsedAt: Date | null
    createdAt: Date
    updatedAt: Date
    _count: StoredImageCountAggregateOutputType | null
    _avg: StoredImageAvgAggregateOutputType | null
    _sum: StoredImageSumAggregateOutputType | null
    _min: StoredImageMinAggregateOutputType | null
    _max: StoredImageMaxAggregateOutputType | null
  }

  type GetStoredImageGroupByPayload<T extends StoredImageGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<StoredImageGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof StoredImageGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], StoredImageGroupByOutputType[P]>
            : GetScalarType<T[P], StoredImageGroupByOutputType[P]>
        }
      >
    >


  export type StoredImageSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    filename?: boolean
    originalUrl?: boolean
    blobUrl?: boolean
    mimeType?: boolean
    fileSize?: boolean
    width?: boolean
    height?: boolean
    searchTerm?: boolean
    tags?: boolean
    pixabayId?: boolean
    pixabayUser?: boolean
    usageCount?: boolean
    lastUsedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["storedImage"]>

  export type StoredImageSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    filename?: boolean
    originalUrl?: boolean
    blobUrl?: boolean
    mimeType?: boolean
    fileSize?: boolean
    width?: boolean
    height?: boolean
    searchTerm?: boolean
    tags?: boolean
    pixabayId?: boolean
    pixabayUser?: boolean
    usageCount?: boolean
    lastUsedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["storedImage"]>

  export type StoredImageSelectScalar = {
    id?: boolean
    filename?: boolean
    originalUrl?: boolean
    blobUrl?: boolean
    mimeType?: boolean
    fileSize?: boolean
    width?: boolean
    height?: boolean
    searchTerm?: boolean
    tags?: boolean
    pixabayId?: boolean
    pixabayUser?: boolean
    usageCount?: boolean
    lastUsedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }


  export type $StoredImagePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "StoredImage"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      filename: string
      originalUrl: string
      blobUrl: string
      mimeType: string
      fileSize: number
      width: number
      height: number
      searchTerm: string | null
      tags: string[]
      pixabayId: number
      pixabayUser: string | null
      usageCount: number
      lastUsedAt: Date | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["storedImage"]>
    composites: {}
  }

  type StoredImageGetPayload<S extends boolean | null | undefined | StoredImageDefaultArgs> = $Result.GetResult<Prisma.$StoredImagePayload, S>

  type StoredImageCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<StoredImageFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: StoredImageCountAggregateInputType | true
    }

  export interface StoredImageDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['StoredImage'], meta: { name: 'StoredImage' } }
    /**
     * Find zero or one StoredImage that matches the filter.
     * @param {StoredImageFindUniqueArgs} args - Arguments to find a StoredImage
     * @example
     * // Get one StoredImage
     * const storedImage = await prisma.storedImage.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends StoredImageFindUniqueArgs>(args: SelectSubset<T, StoredImageFindUniqueArgs<ExtArgs>>): Prisma__StoredImageClient<$Result.GetResult<Prisma.$StoredImagePayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one StoredImage that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {StoredImageFindUniqueOrThrowArgs} args - Arguments to find a StoredImage
     * @example
     * // Get one StoredImage
     * const storedImage = await prisma.storedImage.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends StoredImageFindUniqueOrThrowArgs>(args: SelectSubset<T, StoredImageFindUniqueOrThrowArgs<ExtArgs>>): Prisma__StoredImageClient<$Result.GetResult<Prisma.$StoredImagePayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first StoredImage that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StoredImageFindFirstArgs} args - Arguments to find a StoredImage
     * @example
     * // Get one StoredImage
     * const storedImage = await prisma.storedImage.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends StoredImageFindFirstArgs>(args?: SelectSubset<T, StoredImageFindFirstArgs<ExtArgs>>): Prisma__StoredImageClient<$Result.GetResult<Prisma.$StoredImagePayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first StoredImage that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StoredImageFindFirstOrThrowArgs} args - Arguments to find a StoredImage
     * @example
     * // Get one StoredImage
     * const storedImage = await prisma.storedImage.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends StoredImageFindFirstOrThrowArgs>(args?: SelectSubset<T, StoredImageFindFirstOrThrowArgs<ExtArgs>>): Prisma__StoredImageClient<$Result.GetResult<Prisma.$StoredImagePayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more StoredImages that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StoredImageFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all StoredImages
     * const storedImages = await prisma.storedImage.findMany()
     * 
     * // Get first 10 StoredImages
     * const storedImages = await prisma.storedImage.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const storedImageWithIdOnly = await prisma.storedImage.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends StoredImageFindManyArgs>(args?: SelectSubset<T, StoredImageFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$StoredImagePayload<ExtArgs>, T, "findMany">>

    /**
     * Create a StoredImage.
     * @param {StoredImageCreateArgs} args - Arguments to create a StoredImage.
     * @example
     * // Create one StoredImage
     * const StoredImage = await prisma.storedImage.create({
     *   data: {
     *     // ... data to create a StoredImage
     *   }
     * })
     * 
     */
    create<T extends StoredImageCreateArgs>(args: SelectSubset<T, StoredImageCreateArgs<ExtArgs>>): Prisma__StoredImageClient<$Result.GetResult<Prisma.$StoredImagePayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many StoredImages.
     * @param {StoredImageCreateManyArgs} args - Arguments to create many StoredImages.
     * @example
     * // Create many StoredImages
     * const storedImage = await prisma.storedImage.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends StoredImageCreateManyArgs>(args?: SelectSubset<T, StoredImageCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many StoredImages and returns the data saved in the database.
     * @param {StoredImageCreateManyAndReturnArgs} args - Arguments to create many StoredImages.
     * @example
     * // Create many StoredImages
     * const storedImage = await prisma.storedImage.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many StoredImages and only return the `id`
     * const storedImageWithIdOnly = await prisma.storedImage.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends StoredImageCreateManyAndReturnArgs>(args?: SelectSubset<T, StoredImageCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$StoredImagePayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a StoredImage.
     * @param {StoredImageDeleteArgs} args - Arguments to delete one StoredImage.
     * @example
     * // Delete one StoredImage
     * const StoredImage = await prisma.storedImage.delete({
     *   where: {
     *     // ... filter to delete one StoredImage
     *   }
     * })
     * 
     */
    delete<T extends StoredImageDeleteArgs>(args: SelectSubset<T, StoredImageDeleteArgs<ExtArgs>>): Prisma__StoredImageClient<$Result.GetResult<Prisma.$StoredImagePayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one StoredImage.
     * @param {StoredImageUpdateArgs} args - Arguments to update one StoredImage.
     * @example
     * // Update one StoredImage
     * const storedImage = await prisma.storedImage.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends StoredImageUpdateArgs>(args: SelectSubset<T, StoredImageUpdateArgs<ExtArgs>>): Prisma__StoredImageClient<$Result.GetResult<Prisma.$StoredImagePayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more StoredImages.
     * @param {StoredImageDeleteManyArgs} args - Arguments to filter StoredImages to delete.
     * @example
     * // Delete a few StoredImages
     * const { count } = await prisma.storedImage.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends StoredImageDeleteManyArgs>(args?: SelectSubset<T, StoredImageDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more StoredImages.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StoredImageUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many StoredImages
     * const storedImage = await prisma.storedImage.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends StoredImageUpdateManyArgs>(args: SelectSubset<T, StoredImageUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one StoredImage.
     * @param {StoredImageUpsertArgs} args - Arguments to update or create a StoredImage.
     * @example
     * // Update or create a StoredImage
     * const storedImage = await prisma.storedImage.upsert({
     *   create: {
     *     // ... data to create a StoredImage
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the StoredImage we want to update
     *   }
     * })
     */
    upsert<T extends StoredImageUpsertArgs>(args: SelectSubset<T, StoredImageUpsertArgs<ExtArgs>>): Prisma__StoredImageClient<$Result.GetResult<Prisma.$StoredImagePayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of StoredImages.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StoredImageCountArgs} args - Arguments to filter StoredImages to count.
     * @example
     * // Count the number of StoredImages
     * const count = await prisma.storedImage.count({
     *   where: {
     *     // ... the filter for the StoredImages we want to count
     *   }
     * })
    **/
    count<T extends StoredImageCountArgs>(
      args?: Subset<T, StoredImageCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], StoredImageCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a StoredImage.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StoredImageAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends StoredImageAggregateArgs>(args: Subset<T, StoredImageAggregateArgs>): Prisma.PrismaPromise<GetStoredImageAggregateType<T>>

    /**
     * Group by StoredImage.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StoredImageGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends StoredImageGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: StoredImageGroupByArgs['orderBy'] }
        : { orderBy?: StoredImageGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, StoredImageGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetStoredImageGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the StoredImage model
   */
  readonly fields: StoredImageFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for StoredImage.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__StoredImageClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the StoredImage model
   */ 
  interface StoredImageFieldRefs {
    readonly id: FieldRef<"StoredImage", 'String'>
    readonly filename: FieldRef<"StoredImage", 'String'>
    readonly originalUrl: FieldRef<"StoredImage", 'String'>
    readonly blobUrl: FieldRef<"StoredImage", 'String'>
    readonly mimeType: FieldRef<"StoredImage", 'String'>
    readonly fileSize: FieldRef<"StoredImage", 'Int'>
    readonly width: FieldRef<"StoredImage", 'Int'>
    readonly height: FieldRef<"StoredImage", 'Int'>
    readonly searchTerm: FieldRef<"StoredImage", 'String'>
    readonly tags: FieldRef<"StoredImage", 'String[]'>
    readonly pixabayId: FieldRef<"StoredImage", 'Int'>
    readonly pixabayUser: FieldRef<"StoredImage", 'String'>
    readonly usageCount: FieldRef<"StoredImage", 'Int'>
    readonly lastUsedAt: FieldRef<"StoredImage", 'DateTime'>
    readonly createdAt: FieldRef<"StoredImage", 'DateTime'>
    readonly updatedAt: FieldRef<"StoredImage", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * StoredImage findUnique
   */
  export type StoredImageFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StoredImage
     */
    select?: StoredImageSelect<ExtArgs> | null
    /**
     * Filter, which StoredImage to fetch.
     */
    where: StoredImageWhereUniqueInput
  }

  /**
   * StoredImage findUniqueOrThrow
   */
  export type StoredImageFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StoredImage
     */
    select?: StoredImageSelect<ExtArgs> | null
    /**
     * Filter, which StoredImage to fetch.
     */
    where: StoredImageWhereUniqueInput
  }

  /**
   * StoredImage findFirst
   */
  export type StoredImageFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StoredImage
     */
    select?: StoredImageSelect<ExtArgs> | null
    /**
     * Filter, which StoredImage to fetch.
     */
    where?: StoredImageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of StoredImages to fetch.
     */
    orderBy?: StoredImageOrderByWithRelationInput | StoredImageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for StoredImages.
     */
    cursor?: StoredImageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` StoredImages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` StoredImages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of StoredImages.
     */
    distinct?: StoredImageScalarFieldEnum | StoredImageScalarFieldEnum[]
  }

  /**
   * StoredImage findFirstOrThrow
   */
  export type StoredImageFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StoredImage
     */
    select?: StoredImageSelect<ExtArgs> | null
    /**
     * Filter, which StoredImage to fetch.
     */
    where?: StoredImageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of StoredImages to fetch.
     */
    orderBy?: StoredImageOrderByWithRelationInput | StoredImageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for StoredImages.
     */
    cursor?: StoredImageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` StoredImages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` StoredImages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of StoredImages.
     */
    distinct?: StoredImageScalarFieldEnum | StoredImageScalarFieldEnum[]
  }

  /**
   * StoredImage findMany
   */
  export type StoredImageFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StoredImage
     */
    select?: StoredImageSelect<ExtArgs> | null
    /**
     * Filter, which StoredImages to fetch.
     */
    where?: StoredImageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of StoredImages to fetch.
     */
    orderBy?: StoredImageOrderByWithRelationInput | StoredImageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing StoredImages.
     */
    cursor?: StoredImageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` StoredImages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` StoredImages.
     */
    skip?: number
    distinct?: StoredImageScalarFieldEnum | StoredImageScalarFieldEnum[]
  }

  /**
   * StoredImage create
   */
  export type StoredImageCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StoredImage
     */
    select?: StoredImageSelect<ExtArgs> | null
    /**
     * The data needed to create a StoredImage.
     */
    data: XOR<StoredImageCreateInput, StoredImageUncheckedCreateInput>
  }

  /**
   * StoredImage createMany
   */
  export type StoredImageCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many StoredImages.
     */
    data: StoredImageCreateManyInput | StoredImageCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * StoredImage createManyAndReturn
   */
  export type StoredImageCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StoredImage
     */
    select?: StoredImageSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many StoredImages.
     */
    data: StoredImageCreateManyInput | StoredImageCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * StoredImage update
   */
  export type StoredImageUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StoredImage
     */
    select?: StoredImageSelect<ExtArgs> | null
    /**
     * The data needed to update a StoredImage.
     */
    data: XOR<StoredImageUpdateInput, StoredImageUncheckedUpdateInput>
    /**
     * Choose, which StoredImage to update.
     */
    where: StoredImageWhereUniqueInput
  }

  /**
   * StoredImage updateMany
   */
  export type StoredImageUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update StoredImages.
     */
    data: XOR<StoredImageUpdateManyMutationInput, StoredImageUncheckedUpdateManyInput>
    /**
     * Filter which StoredImages to update
     */
    where?: StoredImageWhereInput
  }

  /**
   * StoredImage upsert
   */
  export type StoredImageUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StoredImage
     */
    select?: StoredImageSelect<ExtArgs> | null
    /**
     * The filter to search for the StoredImage to update in case it exists.
     */
    where: StoredImageWhereUniqueInput
    /**
     * In case the StoredImage found by the `where` argument doesn't exist, create a new StoredImage with this data.
     */
    create: XOR<StoredImageCreateInput, StoredImageUncheckedCreateInput>
    /**
     * In case the StoredImage was found with the provided `where` argument, update it with this data.
     */
    update: XOR<StoredImageUpdateInput, StoredImageUncheckedUpdateInput>
  }

  /**
   * StoredImage delete
   */
  export type StoredImageDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StoredImage
     */
    select?: StoredImageSelect<ExtArgs> | null
    /**
     * Filter which StoredImage to delete.
     */
    where: StoredImageWhereUniqueInput
  }

  /**
   * StoredImage deleteMany
   */
  export type StoredImageDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which StoredImages to delete
     */
    where?: StoredImageWhereInput
  }

  /**
   * StoredImage without action
   */
  export type StoredImageDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StoredImage
     */
    select?: StoredImageSelect<ExtArgs> | null
  }


  /**
   * Model Tag
   */

  export type AggregateTag = {
    _count: TagCountAggregateOutputType | null
    _min: TagMinAggregateOutputType | null
    _max: TagMaxAggregateOutputType | null
  }

  export type TagMinAggregateOutputType = {
    id: string | null
    name: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type TagMaxAggregateOutputType = {
    id: string | null
    name: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type TagCountAggregateOutputType = {
    id: number
    name: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type TagMinAggregateInputType = {
    id?: true
    name?: true
    createdAt?: true
    updatedAt?: true
  }

  export type TagMaxAggregateInputType = {
    id?: true
    name?: true
    createdAt?: true
    updatedAt?: true
  }

  export type TagCountAggregateInputType = {
    id?: true
    name?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type TagAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Tag to aggregate.
     */
    where?: TagWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Tags to fetch.
     */
    orderBy?: TagOrderByWithRelationInput | TagOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TagWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Tags from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Tags.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Tags
    **/
    _count?: true | TagCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TagMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TagMaxAggregateInputType
  }

  export type GetTagAggregateType<T extends TagAggregateArgs> = {
        [P in keyof T & keyof AggregateTag]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTag[P]>
      : GetScalarType<T[P], AggregateTag[P]>
  }




  export type TagGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TagWhereInput
    orderBy?: TagOrderByWithAggregationInput | TagOrderByWithAggregationInput[]
    by: TagScalarFieldEnum[] | TagScalarFieldEnum
    having?: TagScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TagCountAggregateInputType | true
    _min?: TagMinAggregateInputType
    _max?: TagMaxAggregateInputType
  }

  export type TagGroupByOutputType = {
    id: string
    name: string
    createdAt: Date
    updatedAt: Date
    _count: TagCountAggregateOutputType | null
    _min: TagMinAggregateOutputType | null
    _max: TagMaxAggregateOutputType | null
  }

  type GetTagGroupByPayload<T extends TagGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TagGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TagGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TagGroupByOutputType[P]>
            : GetScalarType<T[P], TagGroupByOutputType[P]>
        }
      >
    >


  export type TagSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["tag"]>

  export type TagSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["tag"]>

  export type TagSelectScalar = {
    id?: boolean
    name?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }


  export type $TagPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Tag"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["tag"]>
    composites: {}
  }

  type TagGetPayload<S extends boolean | null | undefined | TagDefaultArgs> = $Result.GetResult<Prisma.$TagPayload, S>

  type TagCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<TagFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: TagCountAggregateInputType | true
    }

  export interface TagDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Tag'], meta: { name: 'Tag' } }
    /**
     * Find zero or one Tag that matches the filter.
     * @param {TagFindUniqueArgs} args - Arguments to find a Tag
     * @example
     * // Get one Tag
     * const tag = await prisma.tag.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TagFindUniqueArgs>(args: SelectSubset<T, TagFindUniqueArgs<ExtArgs>>): Prisma__TagClient<$Result.GetResult<Prisma.$TagPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Tag that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {TagFindUniqueOrThrowArgs} args - Arguments to find a Tag
     * @example
     * // Get one Tag
     * const tag = await prisma.tag.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TagFindUniqueOrThrowArgs>(args: SelectSubset<T, TagFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TagClient<$Result.GetResult<Prisma.$TagPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Tag that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TagFindFirstArgs} args - Arguments to find a Tag
     * @example
     * // Get one Tag
     * const tag = await prisma.tag.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TagFindFirstArgs>(args?: SelectSubset<T, TagFindFirstArgs<ExtArgs>>): Prisma__TagClient<$Result.GetResult<Prisma.$TagPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Tag that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TagFindFirstOrThrowArgs} args - Arguments to find a Tag
     * @example
     * // Get one Tag
     * const tag = await prisma.tag.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TagFindFirstOrThrowArgs>(args?: SelectSubset<T, TagFindFirstOrThrowArgs<ExtArgs>>): Prisma__TagClient<$Result.GetResult<Prisma.$TagPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Tags that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TagFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Tags
     * const tags = await prisma.tag.findMany()
     * 
     * // Get first 10 Tags
     * const tags = await prisma.tag.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const tagWithIdOnly = await prisma.tag.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends TagFindManyArgs>(args?: SelectSubset<T, TagFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TagPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Tag.
     * @param {TagCreateArgs} args - Arguments to create a Tag.
     * @example
     * // Create one Tag
     * const Tag = await prisma.tag.create({
     *   data: {
     *     // ... data to create a Tag
     *   }
     * })
     * 
     */
    create<T extends TagCreateArgs>(args: SelectSubset<T, TagCreateArgs<ExtArgs>>): Prisma__TagClient<$Result.GetResult<Prisma.$TagPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Tags.
     * @param {TagCreateManyArgs} args - Arguments to create many Tags.
     * @example
     * // Create many Tags
     * const tag = await prisma.tag.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TagCreateManyArgs>(args?: SelectSubset<T, TagCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Tags and returns the data saved in the database.
     * @param {TagCreateManyAndReturnArgs} args - Arguments to create many Tags.
     * @example
     * // Create many Tags
     * const tag = await prisma.tag.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Tags and only return the `id`
     * const tagWithIdOnly = await prisma.tag.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends TagCreateManyAndReturnArgs>(args?: SelectSubset<T, TagCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TagPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Tag.
     * @param {TagDeleteArgs} args - Arguments to delete one Tag.
     * @example
     * // Delete one Tag
     * const Tag = await prisma.tag.delete({
     *   where: {
     *     // ... filter to delete one Tag
     *   }
     * })
     * 
     */
    delete<T extends TagDeleteArgs>(args: SelectSubset<T, TagDeleteArgs<ExtArgs>>): Prisma__TagClient<$Result.GetResult<Prisma.$TagPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Tag.
     * @param {TagUpdateArgs} args - Arguments to update one Tag.
     * @example
     * // Update one Tag
     * const tag = await prisma.tag.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TagUpdateArgs>(args: SelectSubset<T, TagUpdateArgs<ExtArgs>>): Prisma__TagClient<$Result.GetResult<Prisma.$TagPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Tags.
     * @param {TagDeleteManyArgs} args - Arguments to filter Tags to delete.
     * @example
     * // Delete a few Tags
     * const { count } = await prisma.tag.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TagDeleteManyArgs>(args?: SelectSubset<T, TagDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Tags.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TagUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Tags
     * const tag = await prisma.tag.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TagUpdateManyArgs>(args: SelectSubset<T, TagUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Tag.
     * @param {TagUpsertArgs} args - Arguments to update or create a Tag.
     * @example
     * // Update or create a Tag
     * const tag = await prisma.tag.upsert({
     *   create: {
     *     // ... data to create a Tag
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Tag we want to update
     *   }
     * })
     */
    upsert<T extends TagUpsertArgs>(args: SelectSubset<T, TagUpsertArgs<ExtArgs>>): Prisma__TagClient<$Result.GetResult<Prisma.$TagPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Tags.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TagCountArgs} args - Arguments to filter Tags to count.
     * @example
     * // Count the number of Tags
     * const count = await prisma.tag.count({
     *   where: {
     *     // ... the filter for the Tags we want to count
     *   }
     * })
    **/
    count<T extends TagCountArgs>(
      args?: Subset<T, TagCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TagCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Tag.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TagAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TagAggregateArgs>(args: Subset<T, TagAggregateArgs>): Prisma.PrismaPromise<GetTagAggregateType<T>>

    /**
     * Group by Tag.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TagGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends TagGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TagGroupByArgs['orderBy'] }
        : { orderBy?: TagGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, TagGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTagGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Tag model
   */
  readonly fields: TagFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Tag.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TagClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Tag model
   */ 
  interface TagFieldRefs {
    readonly id: FieldRef<"Tag", 'String'>
    readonly name: FieldRef<"Tag", 'String'>
    readonly createdAt: FieldRef<"Tag", 'DateTime'>
    readonly updatedAt: FieldRef<"Tag", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Tag findUnique
   */
  export type TagFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tag
     */
    select?: TagSelect<ExtArgs> | null
    /**
     * Filter, which Tag to fetch.
     */
    where: TagWhereUniqueInput
  }

  /**
   * Tag findUniqueOrThrow
   */
  export type TagFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tag
     */
    select?: TagSelect<ExtArgs> | null
    /**
     * Filter, which Tag to fetch.
     */
    where: TagWhereUniqueInput
  }

  /**
   * Tag findFirst
   */
  export type TagFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tag
     */
    select?: TagSelect<ExtArgs> | null
    /**
     * Filter, which Tag to fetch.
     */
    where?: TagWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Tags to fetch.
     */
    orderBy?: TagOrderByWithRelationInput | TagOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Tags.
     */
    cursor?: TagWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Tags from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Tags.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Tags.
     */
    distinct?: TagScalarFieldEnum | TagScalarFieldEnum[]
  }

  /**
   * Tag findFirstOrThrow
   */
  export type TagFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tag
     */
    select?: TagSelect<ExtArgs> | null
    /**
     * Filter, which Tag to fetch.
     */
    where?: TagWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Tags to fetch.
     */
    orderBy?: TagOrderByWithRelationInput | TagOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Tags.
     */
    cursor?: TagWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Tags from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Tags.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Tags.
     */
    distinct?: TagScalarFieldEnum | TagScalarFieldEnum[]
  }

  /**
   * Tag findMany
   */
  export type TagFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tag
     */
    select?: TagSelect<ExtArgs> | null
    /**
     * Filter, which Tags to fetch.
     */
    where?: TagWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Tags to fetch.
     */
    orderBy?: TagOrderByWithRelationInput | TagOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Tags.
     */
    cursor?: TagWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Tags from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Tags.
     */
    skip?: number
    distinct?: TagScalarFieldEnum | TagScalarFieldEnum[]
  }

  /**
   * Tag create
   */
  export type TagCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tag
     */
    select?: TagSelect<ExtArgs> | null
    /**
     * The data needed to create a Tag.
     */
    data: XOR<TagCreateInput, TagUncheckedCreateInput>
  }

  /**
   * Tag createMany
   */
  export type TagCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Tags.
     */
    data: TagCreateManyInput | TagCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Tag createManyAndReturn
   */
  export type TagCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tag
     */
    select?: TagSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Tags.
     */
    data: TagCreateManyInput | TagCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Tag update
   */
  export type TagUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tag
     */
    select?: TagSelect<ExtArgs> | null
    /**
     * The data needed to update a Tag.
     */
    data: XOR<TagUpdateInput, TagUncheckedUpdateInput>
    /**
     * Choose, which Tag to update.
     */
    where: TagWhereUniqueInput
  }

  /**
   * Tag updateMany
   */
  export type TagUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Tags.
     */
    data: XOR<TagUpdateManyMutationInput, TagUncheckedUpdateManyInput>
    /**
     * Filter which Tags to update
     */
    where?: TagWhereInput
  }

  /**
   * Tag upsert
   */
  export type TagUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tag
     */
    select?: TagSelect<ExtArgs> | null
    /**
     * The filter to search for the Tag to update in case it exists.
     */
    where: TagWhereUniqueInput
    /**
     * In case the Tag found by the `where` argument doesn't exist, create a new Tag with this data.
     */
    create: XOR<TagCreateInput, TagUncheckedCreateInput>
    /**
     * In case the Tag was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TagUpdateInput, TagUncheckedUpdateInput>
  }

  /**
   * Tag delete
   */
  export type TagDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tag
     */
    select?: TagSelect<ExtArgs> | null
    /**
     * Filter which Tag to delete.
     */
    where: TagWhereUniqueInput
  }

  /**
   * Tag deleteMany
   */
  export type TagDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Tags to delete
     */
    where?: TagWhereInput
  }

  /**
   * Tag without action
   */
  export type TagDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tag
     */
    select?: TagSelect<ExtArgs> | null
  }


  /**
   * Model Story
   */

  export type AggregateStory = {
    _count: StoryCountAggregateOutputType | null
    _min: StoryMinAggregateOutputType | null
    _max: StoryMaxAggregateOutputType | null
  }

  export type StoryMinAggregateOutputType = {
    id: string | null
    authorId: string | null
    title: string | null
    topicPrompt: string | null
    storyType: string | null
    characterSheet: string | null
    artStyle: string | null
    exampleStory: string | null
    showExampleToStudents: boolean | null
    status: $Enums.StoryStatus | null
    shareToken: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type StoryMaxAggregateOutputType = {
    id: string | null
    authorId: string | null
    title: string | null
    topicPrompt: string | null
    storyType: string | null
    characterSheet: string | null
    artStyle: string | null
    exampleStory: string | null
    showExampleToStudents: boolean | null
    status: $Enums.StoryStatus | null
    shareToken: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type StoryCountAggregateOutputType = {
    id: number
    authorId: number
    title: number
    topicPrompt: number
    tags: number
    storyType: number
    characterSheet: number
    artStyle: number
    exampleStory: number
    showExampleToStudents: number
    status: number
    shareToken: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type StoryMinAggregateInputType = {
    id?: true
    authorId?: true
    title?: true
    topicPrompt?: true
    storyType?: true
    characterSheet?: true
    artStyle?: true
    exampleStory?: true
    showExampleToStudents?: true
    status?: true
    shareToken?: true
    createdAt?: true
    updatedAt?: true
  }

  export type StoryMaxAggregateInputType = {
    id?: true
    authorId?: true
    title?: true
    topicPrompt?: true
    storyType?: true
    characterSheet?: true
    artStyle?: true
    exampleStory?: true
    showExampleToStudents?: true
    status?: true
    shareToken?: true
    createdAt?: true
    updatedAt?: true
  }

  export type StoryCountAggregateInputType = {
    id?: true
    authorId?: true
    title?: true
    topicPrompt?: true
    tags?: true
    storyType?: true
    characterSheet?: true
    artStyle?: true
    exampleStory?: true
    showExampleToStudents?: true
    status?: true
    shareToken?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type StoryAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Story to aggregate.
     */
    where?: StoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Stories to fetch.
     */
    orderBy?: StoryOrderByWithRelationInput | StoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: StoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Stories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Stories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Stories
    **/
    _count?: true | StoryCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: StoryMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: StoryMaxAggregateInputType
  }

  export type GetStoryAggregateType<T extends StoryAggregateArgs> = {
        [P in keyof T & keyof AggregateStory]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateStory[P]>
      : GetScalarType<T[P], AggregateStory[P]>
  }




  export type StoryGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: StoryWhereInput
    orderBy?: StoryOrderByWithAggregationInput | StoryOrderByWithAggregationInput[]
    by: StoryScalarFieldEnum[] | StoryScalarFieldEnum
    having?: StoryScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: StoryCountAggregateInputType | true
    _min?: StoryMinAggregateInputType
    _max?: StoryMaxAggregateInputType
  }

  export type StoryGroupByOutputType = {
    id: string
    authorId: string
    title: string
    topicPrompt: string
    tags: string[]
    storyType: string | null
    characterSheet: string | null
    artStyle: string | null
    exampleStory: string | null
    showExampleToStudents: boolean
    status: $Enums.StoryStatus
    shareToken: string
    createdAt: Date
    updatedAt: Date
    _count: StoryCountAggregateOutputType | null
    _min: StoryMinAggregateOutputType | null
    _max: StoryMaxAggregateOutputType | null
  }

  type GetStoryGroupByPayload<T extends StoryGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<StoryGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof StoryGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], StoryGroupByOutputType[P]>
            : GetScalarType<T[P], StoryGroupByOutputType[P]>
        }
      >
    >


  export type StorySelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    authorId?: boolean
    title?: boolean
    topicPrompt?: boolean
    tags?: boolean
    storyType?: boolean
    characterSheet?: boolean
    artStyle?: boolean
    exampleStory?: boolean
    showExampleToStudents?: boolean
    status?: boolean
    shareToken?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    panels?: boolean | Story$panelsArgs<ExtArgs>
    submissions?: boolean | Story$submissionsArgs<ExtArgs>
    _count?: boolean | StoryCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["story"]>

  export type StorySelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    authorId?: boolean
    title?: boolean
    topicPrompt?: boolean
    tags?: boolean
    storyType?: boolean
    characterSheet?: boolean
    artStyle?: boolean
    exampleStory?: boolean
    showExampleToStudents?: boolean
    status?: boolean
    shareToken?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["story"]>

  export type StorySelectScalar = {
    id?: boolean
    authorId?: boolean
    title?: boolean
    topicPrompt?: boolean
    tags?: boolean
    storyType?: boolean
    characterSheet?: boolean
    artStyle?: boolean
    exampleStory?: boolean
    showExampleToStudents?: boolean
    status?: boolean
    shareToken?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type StoryInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    panels?: boolean | Story$panelsArgs<ExtArgs>
    submissions?: boolean | Story$submissionsArgs<ExtArgs>
    _count?: boolean | StoryCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type StoryIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $StoryPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Story"
    objects: {
      panels: Prisma.$StoryPanelPayload<ExtArgs>[]
      submissions: Prisma.$StorySubmissionPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      authorId: string
      title: string
      topicPrompt: string
      tags: string[]
      storyType: string | null
      characterSheet: string | null
      artStyle: string | null
      exampleStory: string | null
      showExampleToStudents: boolean
      status: $Enums.StoryStatus
      shareToken: string
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["story"]>
    composites: {}
  }

  type StoryGetPayload<S extends boolean | null | undefined | StoryDefaultArgs> = $Result.GetResult<Prisma.$StoryPayload, S>

  type StoryCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<StoryFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: StoryCountAggregateInputType | true
    }

  export interface StoryDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Story'], meta: { name: 'Story' } }
    /**
     * Find zero or one Story that matches the filter.
     * @param {StoryFindUniqueArgs} args - Arguments to find a Story
     * @example
     * // Get one Story
     * const story = await prisma.story.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends StoryFindUniqueArgs>(args: SelectSubset<T, StoryFindUniqueArgs<ExtArgs>>): Prisma__StoryClient<$Result.GetResult<Prisma.$StoryPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Story that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {StoryFindUniqueOrThrowArgs} args - Arguments to find a Story
     * @example
     * // Get one Story
     * const story = await prisma.story.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends StoryFindUniqueOrThrowArgs>(args: SelectSubset<T, StoryFindUniqueOrThrowArgs<ExtArgs>>): Prisma__StoryClient<$Result.GetResult<Prisma.$StoryPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Story that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StoryFindFirstArgs} args - Arguments to find a Story
     * @example
     * // Get one Story
     * const story = await prisma.story.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends StoryFindFirstArgs>(args?: SelectSubset<T, StoryFindFirstArgs<ExtArgs>>): Prisma__StoryClient<$Result.GetResult<Prisma.$StoryPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Story that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StoryFindFirstOrThrowArgs} args - Arguments to find a Story
     * @example
     * // Get one Story
     * const story = await prisma.story.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends StoryFindFirstOrThrowArgs>(args?: SelectSubset<T, StoryFindFirstOrThrowArgs<ExtArgs>>): Prisma__StoryClient<$Result.GetResult<Prisma.$StoryPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Stories that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StoryFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Stories
     * const stories = await prisma.story.findMany()
     * 
     * // Get first 10 Stories
     * const stories = await prisma.story.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const storyWithIdOnly = await prisma.story.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends StoryFindManyArgs>(args?: SelectSubset<T, StoryFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$StoryPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Story.
     * @param {StoryCreateArgs} args - Arguments to create a Story.
     * @example
     * // Create one Story
     * const Story = await prisma.story.create({
     *   data: {
     *     // ... data to create a Story
     *   }
     * })
     * 
     */
    create<T extends StoryCreateArgs>(args: SelectSubset<T, StoryCreateArgs<ExtArgs>>): Prisma__StoryClient<$Result.GetResult<Prisma.$StoryPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Stories.
     * @param {StoryCreateManyArgs} args - Arguments to create many Stories.
     * @example
     * // Create many Stories
     * const story = await prisma.story.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends StoryCreateManyArgs>(args?: SelectSubset<T, StoryCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Stories and returns the data saved in the database.
     * @param {StoryCreateManyAndReturnArgs} args - Arguments to create many Stories.
     * @example
     * // Create many Stories
     * const story = await prisma.story.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Stories and only return the `id`
     * const storyWithIdOnly = await prisma.story.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends StoryCreateManyAndReturnArgs>(args?: SelectSubset<T, StoryCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$StoryPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Story.
     * @param {StoryDeleteArgs} args - Arguments to delete one Story.
     * @example
     * // Delete one Story
     * const Story = await prisma.story.delete({
     *   where: {
     *     // ... filter to delete one Story
     *   }
     * })
     * 
     */
    delete<T extends StoryDeleteArgs>(args: SelectSubset<T, StoryDeleteArgs<ExtArgs>>): Prisma__StoryClient<$Result.GetResult<Prisma.$StoryPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Story.
     * @param {StoryUpdateArgs} args - Arguments to update one Story.
     * @example
     * // Update one Story
     * const story = await prisma.story.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends StoryUpdateArgs>(args: SelectSubset<T, StoryUpdateArgs<ExtArgs>>): Prisma__StoryClient<$Result.GetResult<Prisma.$StoryPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Stories.
     * @param {StoryDeleteManyArgs} args - Arguments to filter Stories to delete.
     * @example
     * // Delete a few Stories
     * const { count } = await prisma.story.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends StoryDeleteManyArgs>(args?: SelectSubset<T, StoryDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Stories.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StoryUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Stories
     * const story = await prisma.story.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends StoryUpdateManyArgs>(args: SelectSubset<T, StoryUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Story.
     * @param {StoryUpsertArgs} args - Arguments to update or create a Story.
     * @example
     * // Update or create a Story
     * const story = await prisma.story.upsert({
     *   create: {
     *     // ... data to create a Story
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Story we want to update
     *   }
     * })
     */
    upsert<T extends StoryUpsertArgs>(args: SelectSubset<T, StoryUpsertArgs<ExtArgs>>): Prisma__StoryClient<$Result.GetResult<Prisma.$StoryPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Stories.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StoryCountArgs} args - Arguments to filter Stories to count.
     * @example
     * // Count the number of Stories
     * const count = await prisma.story.count({
     *   where: {
     *     // ... the filter for the Stories we want to count
     *   }
     * })
    **/
    count<T extends StoryCountArgs>(
      args?: Subset<T, StoryCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], StoryCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Story.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StoryAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends StoryAggregateArgs>(args: Subset<T, StoryAggregateArgs>): Prisma.PrismaPromise<GetStoryAggregateType<T>>

    /**
     * Group by Story.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StoryGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends StoryGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: StoryGroupByArgs['orderBy'] }
        : { orderBy?: StoryGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, StoryGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetStoryGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Story model
   */
  readonly fields: StoryFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Story.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__StoryClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    panels<T extends Story$panelsArgs<ExtArgs> = {}>(args?: Subset<T, Story$panelsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$StoryPanelPayload<ExtArgs>, T, "findMany"> | Null>
    submissions<T extends Story$submissionsArgs<ExtArgs> = {}>(args?: Subset<T, Story$submissionsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$StorySubmissionPayload<ExtArgs>, T, "findMany"> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Story model
   */ 
  interface StoryFieldRefs {
    readonly id: FieldRef<"Story", 'String'>
    readonly authorId: FieldRef<"Story", 'String'>
    readonly title: FieldRef<"Story", 'String'>
    readonly topicPrompt: FieldRef<"Story", 'String'>
    readonly tags: FieldRef<"Story", 'String[]'>
    readonly storyType: FieldRef<"Story", 'String'>
    readonly characterSheet: FieldRef<"Story", 'String'>
    readonly artStyle: FieldRef<"Story", 'String'>
    readonly exampleStory: FieldRef<"Story", 'String'>
    readonly showExampleToStudents: FieldRef<"Story", 'Boolean'>
    readonly status: FieldRef<"Story", 'StoryStatus'>
    readonly shareToken: FieldRef<"Story", 'String'>
    readonly createdAt: FieldRef<"Story", 'DateTime'>
    readonly updatedAt: FieldRef<"Story", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Story findUnique
   */
  export type StoryFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Story
     */
    select?: StorySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StoryInclude<ExtArgs> | null
    /**
     * Filter, which Story to fetch.
     */
    where: StoryWhereUniqueInput
  }

  /**
   * Story findUniqueOrThrow
   */
  export type StoryFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Story
     */
    select?: StorySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StoryInclude<ExtArgs> | null
    /**
     * Filter, which Story to fetch.
     */
    where: StoryWhereUniqueInput
  }

  /**
   * Story findFirst
   */
  export type StoryFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Story
     */
    select?: StorySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StoryInclude<ExtArgs> | null
    /**
     * Filter, which Story to fetch.
     */
    where?: StoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Stories to fetch.
     */
    orderBy?: StoryOrderByWithRelationInput | StoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Stories.
     */
    cursor?: StoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Stories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Stories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Stories.
     */
    distinct?: StoryScalarFieldEnum | StoryScalarFieldEnum[]
  }

  /**
   * Story findFirstOrThrow
   */
  export type StoryFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Story
     */
    select?: StorySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StoryInclude<ExtArgs> | null
    /**
     * Filter, which Story to fetch.
     */
    where?: StoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Stories to fetch.
     */
    orderBy?: StoryOrderByWithRelationInput | StoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Stories.
     */
    cursor?: StoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Stories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Stories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Stories.
     */
    distinct?: StoryScalarFieldEnum | StoryScalarFieldEnum[]
  }

  /**
   * Story findMany
   */
  export type StoryFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Story
     */
    select?: StorySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StoryInclude<ExtArgs> | null
    /**
     * Filter, which Stories to fetch.
     */
    where?: StoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Stories to fetch.
     */
    orderBy?: StoryOrderByWithRelationInput | StoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Stories.
     */
    cursor?: StoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Stories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Stories.
     */
    skip?: number
    distinct?: StoryScalarFieldEnum | StoryScalarFieldEnum[]
  }

  /**
   * Story create
   */
  export type StoryCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Story
     */
    select?: StorySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StoryInclude<ExtArgs> | null
    /**
     * The data needed to create a Story.
     */
    data: XOR<StoryCreateInput, StoryUncheckedCreateInput>
  }

  /**
   * Story createMany
   */
  export type StoryCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Stories.
     */
    data: StoryCreateManyInput | StoryCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Story createManyAndReturn
   */
  export type StoryCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Story
     */
    select?: StorySelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Stories.
     */
    data: StoryCreateManyInput | StoryCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Story update
   */
  export type StoryUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Story
     */
    select?: StorySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StoryInclude<ExtArgs> | null
    /**
     * The data needed to update a Story.
     */
    data: XOR<StoryUpdateInput, StoryUncheckedUpdateInput>
    /**
     * Choose, which Story to update.
     */
    where: StoryWhereUniqueInput
  }

  /**
   * Story updateMany
   */
  export type StoryUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Stories.
     */
    data: XOR<StoryUpdateManyMutationInput, StoryUncheckedUpdateManyInput>
    /**
     * Filter which Stories to update
     */
    where?: StoryWhereInput
  }

  /**
   * Story upsert
   */
  export type StoryUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Story
     */
    select?: StorySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StoryInclude<ExtArgs> | null
    /**
     * The filter to search for the Story to update in case it exists.
     */
    where: StoryWhereUniqueInput
    /**
     * In case the Story found by the `where` argument doesn't exist, create a new Story with this data.
     */
    create: XOR<StoryCreateInput, StoryUncheckedCreateInput>
    /**
     * In case the Story was found with the provided `where` argument, update it with this data.
     */
    update: XOR<StoryUpdateInput, StoryUncheckedUpdateInput>
  }

  /**
   * Story delete
   */
  export type StoryDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Story
     */
    select?: StorySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StoryInclude<ExtArgs> | null
    /**
     * Filter which Story to delete.
     */
    where: StoryWhereUniqueInput
  }

  /**
   * Story deleteMany
   */
  export type StoryDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Stories to delete
     */
    where?: StoryWhereInput
  }

  /**
   * Story.panels
   */
  export type Story$panelsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StoryPanel
     */
    select?: StoryPanelSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StoryPanelInclude<ExtArgs> | null
    where?: StoryPanelWhereInput
    orderBy?: StoryPanelOrderByWithRelationInput | StoryPanelOrderByWithRelationInput[]
    cursor?: StoryPanelWhereUniqueInput
    take?: number
    skip?: number
    distinct?: StoryPanelScalarFieldEnum | StoryPanelScalarFieldEnum[]
  }

  /**
   * Story.submissions
   */
  export type Story$submissionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StorySubmission
     */
    select?: StorySubmissionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StorySubmissionInclude<ExtArgs> | null
    where?: StorySubmissionWhereInput
    orderBy?: StorySubmissionOrderByWithRelationInput | StorySubmissionOrderByWithRelationInput[]
    cursor?: StorySubmissionWhereUniqueInput
    take?: number
    skip?: number
    distinct?: StorySubmissionScalarFieldEnum | StorySubmissionScalarFieldEnum[]
  }

  /**
   * Story without action
   */
  export type StoryDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Story
     */
    select?: StorySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StoryInclude<ExtArgs> | null
  }


  /**
   * Model StoryPanel
   */

  export type AggregateStoryPanel = {
    _count: StoryPanelCountAggregateOutputType | null
    _avg: StoryPanelAvgAggregateOutputType | null
    _sum: StoryPanelSumAggregateOutputType | null
    _min: StoryPanelMinAggregateOutputType | null
    _max: StoryPanelMaxAggregateOutputType | null
  }

  export type StoryPanelAvgAggregateOutputType = {
    order: number | null
  }

  export type StoryPanelSumAggregateOutputType = {
    order: number | null
  }

  export type StoryPanelMinAggregateOutputType = {
    id: string | null
    storyId: string | null
    order: number | null
    imageUrl: string | null
    sceneDescription: string | null
    imagePrompt: string | null
    exampleSentence: string | null
  }

  export type StoryPanelMaxAggregateOutputType = {
    id: string | null
    storyId: string | null
    order: number | null
    imageUrl: string | null
    sceneDescription: string | null
    imagePrompt: string | null
    exampleSentence: string | null
  }

  export type StoryPanelCountAggregateOutputType = {
    id: number
    storyId: number
    order: number
    imageUrl: number
    sceneDescription: number
    imagePrompt: number
    exampleSentence: number
    mouth: number
    _all: number
  }


  export type StoryPanelAvgAggregateInputType = {
    order?: true
  }

  export type StoryPanelSumAggregateInputType = {
    order?: true
  }

  export type StoryPanelMinAggregateInputType = {
    id?: true
    storyId?: true
    order?: true
    imageUrl?: true
    sceneDescription?: true
    imagePrompt?: true
    exampleSentence?: true
  }

  export type StoryPanelMaxAggregateInputType = {
    id?: true
    storyId?: true
    order?: true
    imageUrl?: true
    sceneDescription?: true
    imagePrompt?: true
    exampleSentence?: true
  }

  export type StoryPanelCountAggregateInputType = {
    id?: true
    storyId?: true
    order?: true
    imageUrl?: true
    sceneDescription?: true
    imagePrompt?: true
    exampleSentence?: true
    mouth?: true
    _all?: true
  }

  export type StoryPanelAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which StoryPanel to aggregate.
     */
    where?: StoryPanelWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of StoryPanels to fetch.
     */
    orderBy?: StoryPanelOrderByWithRelationInput | StoryPanelOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: StoryPanelWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` StoryPanels from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` StoryPanels.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned StoryPanels
    **/
    _count?: true | StoryPanelCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: StoryPanelAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: StoryPanelSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: StoryPanelMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: StoryPanelMaxAggregateInputType
  }

  export type GetStoryPanelAggregateType<T extends StoryPanelAggregateArgs> = {
        [P in keyof T & keyof AggregateStoryPanel]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateStoryPanel[P]>
      : GetScalarType<T[P], AggregateStoryPanel[P]>
  }




  export type StoryPanelGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: StoryPanelWhereInput
    orderBy?: StoryPanelOrderByWithAggregationInput | StoryPanelOrderByWithAggregationInput[]
    by: StoryPanelScalarFieldEnum[] | StoryPanelScalarFieldEnum
    having?: StoryPanelScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: StoryPanelCountAggregateInputType | true
    _avg?: StoryPanelAvgAggregateInputType
    _sum?: StoryPanelSumAggregateInputType
    _min?: StoryPanelMinAggregateInputType
    _max?: StoryPanelMaxAggregateInputType
  }

  export type StoryPanelGroupByOutputType = {
    id: string
    storyId: string
    order: number
    imageUrl: string | null
    sceneDescription: string
    imagePrompt: string | null
    exampleSentence: string | null
    mouth: JsonValue | null
    _count: StoryPanelCountAggregateOutputType | null
    _avg: StoryPanelAvgAggregateOutputType | null
    _sum: StoryPanelSumAggregateOutputType | null
    _min: StoryPanelMinAggregateOutputType | null
    _max: StoryPanelMaxAggregateOutputType | null
  }

  type GetStoryPanelGroupByPayload<T extends StoryPanelGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<StoryPanelGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof StoryPanelGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], StoryPanelGroupByOutputType[P]>
            : GetScalarType<T[P], StoryPanelGroupByOutputType[P]>
        }
      >
    >


  export type StoryPanelSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    storyId?: boolean
    order?: boolean
    imageUrl?: boolean
    sceneDescription?: boolean
    imagePrompt?: boolean
    exampleSentence?: boolean
    mouth?: boolean
    story?: boolean | StoryDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["storyPanel"]>

  export type StoryPanelSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    storyId?: boolean
    order?: boolean
    imageUrl?: boolean
    sceneDescription?: boolean
    imagePrompt?: boolean
    exampleSentence?: boolean
    mouth?: boolean
    story?: boolean | StoryDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["storyPanel"]>

  export type StoryPanelSelectScalar = {
    id?: boolean
    storyId?: boolean
    order?: boolean
    imageUrl?: boolean
    sceneDescription?: boolean
    imagePrompt?: boolean
    exampleSentence?: boolean
    mouth?: boolean
  }

  export type StoryPanelInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    story?: boolean | StoryDefaultArgs<ExtArgs>
  }
  export type StoryPanelIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    story?: boolean | StoryDefaultArgs<ExtArgs>
  }

  export type $StoryPanelPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "StoryPanel"
    objects: {
      story: Prisma.$StoryPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      storyId: string
      order: number
      imageUrl: string | null
      sceneDescription: string
      imagePrompt: string | null
      exampleSentence: string | null
      mouth: Prisma.JsonValue | null
    }, ExtArgs["result"]["storyPanel"]>
    composites: {}
  }

  type StoryPanelGetPayload<S extends boolean | null | undefined | StoryPanelDefaultArgs> = $Result.GetResult<Prisma.$StoryPanelPayload, S>

  type StoryPanelCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<StoryPanelFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: StoryPanelCountAggregateInputType | true
    }

  export interface StoryPanelDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['StoryPanel'], meta: { name: 'StoryPanel' } }
    /**
     * Find zero or one StoryPanel that matches the filter.
     * @param {StoryPanelFindUniqueArgs} args - Arguments to find a StoryPanel
     * @example
     * // Get one StoryPanel
     * const storyPanel = await prisma.storyPanel.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends StoryPanelFindUniqueArgs>(args: SelectSubset<T, StoryPanelFindUniqueArgs<ExtArgs>>): Prisma__StoryPanelClient<$Result.GetResult<Prisma.$StoryPanelPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one StoryPanel that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {StoryPanelFindUniqueOrThrowArgs} args - Arguments to find a StoryPanel
     * @example
     * // Get one StoryPanel
     * const storyPanel = await prisma.storyPanel.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends StoryPanelFindUniqueOrThrowArgs>(args: SelectSubset<T, StoryPanelFindUniqueOrThrowArgs<ExtArgs>>): Prisma__StoryPanelClient<$Result.GetResult<Prisma.$StoryPanelPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first StoryPanel that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StoryPanelFindFirstArgs} args - Arguments to find a StoryPanel
     * @example
     * // Get one StoryPanel
     * const storyPanel = await prisma.storyPanel.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends StoryPanelFindFirstArgs>(args?: SelectSubset<T, StoryPanelFindFirstArgs<ExtArgs>>): Prisma__StoryPanelClient<$Result.GetResult<Prisma.$StoryPanelPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first StoryPanel that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StoryPanelFindFirstOrThrowArgs} args - Arguments to find a StoryPanel
     * @example
     * // Get one StoryPanel
     * const storyPanel = await prisma.storyPanel.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends StoryPanelFindFirstOrThrowArgs>(args?: SelectSubset<T, StoryPanelFindFirstOrThrowArgs<ExtArgs>>): Prisma__StoryPanelClient<$Result.GetResult<Prisma.$StoryPanelPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more StoryPanels that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StoryPanelFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all StoryPanels
     * const storyPanels = await prisma.storyPanel.findMany()
     * 
     * // Get first 10 StoryPanels
     * const storyPanels = await prisma.storyPanel.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const storyPanelWithIdOnly = await prisma.storyPanel.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends StoryPanelFindManyArgs>(args?: SelectSubset<T, StoryPanelFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$StoryPanelPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a StoryPanel.
     * @param {StoryPanelCreateArgs} args - Arguments to create a StoryPanel.
     * @example
     * // Create one StoryPanel
     * const StoryPanel = await prisma.storyPanel.create({
     *   data: {
     *     // ... data to create a StoryPanel
     *   }
     * })
     * 
     */
    create<T extends StoryPanelCreateArgs>(args: SelectSubset<T, StoryPanelCreateArgs<ExtArgs>>): Prisma__StoryPanelClient<$Result.GetResult<Prisma.$StoryPanelPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many StoryPanels.
     * @param {StoryPanelCreateManyArgs} args - Arguments to create many StoryPanels.
     * @example
     * // Create many StoryPanels
     * const storyPanel = await prisma.storyPanel.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends StoryPanelCreateManyArgs>(args?: SelectSubset<T, StoryPanelCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many StoryPanels and returns the data saved in the database.
     * @param {StoryPanelCreateManyAndReturnArgs} args - Arguments to create many StoryPanels.
     * @example
     * // Create many StoryPanels
     * const storyPanel = await prisma.storyPanel.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many StoryPanels and only return the `id`
     * const storyPanelWithIdOnly = await prisma.storyPanel.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends StoryPanelCreateManyAndReturnArgs>(args?: SelectSubset<T, StoryPanelCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$StoryPanelPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a StoryPanel.
     * @param {StoryPanelDeleteArgs} args - Arguments to delete one StoryPanel.
     * @example
     * // Delete one StoryPanel
     * const StoryPanel = await prisma.storyPanel.delete({
     *   where: {
     *     // ... filter to delete one StoryPanel
     *   }
     * })
     * 
     */
    delete<T extends StoryPanelDeleteArgs>(args: SelectSubset<T, StoryPanelDeleteArgs<ExtArgs>>): Prisma__StoryPanelClient<$Result.GetResult<Prisma.$StoryPanelPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one StoryPanel.
     * @param {StoryPanelUpdateArgs} args - Arguments to update one StoryPanel.
     * @example
     * // Update one StoryPanel
     * const storyPanel = await prisma.storyPanel.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends StoryPanelUpdateArgs>(args: SelectSubset<T, StoryPanelUpdateArgs<ExtArgs>>): Prisma__StoryPanelClient<$Result.GetResult<Prisma.$StoryPanelPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more StoryPanels.
     * @param {StoryPanelDeleteManyArgs} args - Arguments to filter StoryPanels to delete.
     * @example
     * // Delete a few StoryPanels
     * const { count } = await prisma.storyPanel.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends StoryPanelDeleteManyArgs>(args?: SelectSubset<T, StoryPanelDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more StoryPanels.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StoryPanelUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many StoryPanels
     * const storyPanel = await prisma.storyPanel.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends StoryPanelUpdateManyArgs>(args: SelectSubset<T, StoryPanelUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one StoryPanel.
     * @param {StoryPanelUpsertArgs} args - Arguments to update or create a StoryPanel.
     * @example
     * // Update or create a StoryPanel
     * const storyPanel = await prisma.storyPanel.upsert({
     *   create: {
     *     // ... data to create a StoryPanel
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the StoryPanel we want to update
     *   }
     * })
     */
    upsert<T extends StoryPanelUpsertArgs>(args: SelectSubset<T, StoryPanelUpsertArgs<ExtArgs>>): Prisma__StoryPanelClient<$Result.GetResult<Prisma.$StoryPanelPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of StoryPanels.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StoryPanelCountArgs} args - Arguments to filter StoryPanels to count.
     * @example
     * // Count the number of StoryPanels
     * const count = await prisma.storyPanel.count({
     *   where: {
     *     // ... the filter for the StoryPanels we want to count
     *   }
     * })
    **/
    count<T extends StoryPanelCountArgs>(
      args?: Subset<T, StoryPanelCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], StoryPanelCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a StoryPanel.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StoryPanelAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends StoryPanelAggregateArgs>(args: Subset<T, StoryPanelAggregateArgs>): Prisma.PrismaPromise<GetStoryPanelAggregateType<T>>

    /**
     * Group by StoryPanel.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StoryPanelGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends StoryPanelGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: StoryPanelGroupByArgs['orderBy'] }
        : { orderBy?: StoryPanelGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, StoryPanelGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetStoryPanelGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the StoryPanel model
   */
  readonly fields: StoryPanelFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for StoryPanel.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__StoryPanelClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    story<T extends StoryDefaultArgs<ExtArgs> = {}>(args?: Subset<T, StoryDefaultArgs<ExtArgs>>): Prisma__StoryClient<$Result.GetResult<Prisma.$StoryPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the StoryPanel model
   */ 
  interface StoryPanelFieldRefs {
    readonly id: FieldRef<"StoryPanel", 'String'>
    readonly storyId: FieldRef<"StoryPanel", 'String'>
    readonly order: FieldRef<"StoryPanel", 'Int'>
    readonly imageUrl: FieldRef<"StoryPanel", 'String'>
    readonly sceneDescription: FieldRef<"StoryPanel", 'String'>
    readonly imagePrompt: FieldRef<"StoryPanel", 'String'>
    readonly exampleSentence: FieldRef<"StoryPanel", 'String'>
    readonly mouth: FieldRef<"StoryPanel", 'Json'>
  }
    

  // Custom InputTypes
  /**
   * StoryPanel findUnique
   */
  export type StoryPanelFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StoryPanel
     */
    select?: StoryPanelSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StoryPanelInclude<ExtArgs> | null
    /**
     * Filter, which StoryPanel to fetch.
     */
    where: StoryPanelWhereUniqueInput
  }

  /**
   * StoryPanel findUniqueOrThrow
   */
  export type StoryPanelFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StoryPanel
     */
    select?: StoryPanelSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StoryPanelInclude<ExtArgs> | null
    /**
     * Filter, which StoryPanel to fetch.
     */
    where: StoryPanelWhereUniqueInput
  }

  /**
   * StoryPanel findFirst
   */
  export type StoryPanelFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StoryPanel
     */
    select?: StoryPanelSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StoryPanelInclude<ExtArgs> | null
    /**
     * Filter, which StoryPanel to fetch.
     */
    where?: StoryPanelWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of StoryPanels to fetch.
     */
    orderBy?: StoryPanelOrderByWithRelationInput | StoryPanelOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for StoryPanels.
     */
    cursor?: StoryPanelWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` StoryPanels from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` StoryPanels.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of StoryPanels.
     */
    distinct?: StoryPanelScalarFieldEnum | StoryPanelScalarFieldEnum[]
  }

  /**
   * StoryPanel findFirstOrThrow
   */
  export type StoryPanelFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StoryPanel
     */
    select?: StoryPanelSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StoryPanelInclude<ExtArgs> | null
    /**
     * Filter, which StoryPanel to fetch.
     */
    where?: StoryPanelWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of StoryPanels to fetch.
     */
    orderBy?: StoryPanelOrderByWithRelationInput | StoryPanelOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for StoryPanels.
     */
    cursor?: StoryPanelWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` StoryPanels from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` StoryPanels.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of StoryPanels.
     */
    distinct?: StoryPanelScalarFieldEnum | StoryPanelScalarFieldEnum[]
  }

  /**
   * StoryPanel findMany
   */
  export type StoryPanelFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StoryPanel
     */
    select?: StoryPanelSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StoryPanelInclude<ExtArgs> | null
    /**
     * Filter, which StoryPanels to fetch.
     */
    where?: StoryPanelWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of StoryPanels to fetch.
     */
    orderBy?: StoryPanelOrderByWithRelationInput | StoryPanelOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing StoryPanels.
     */
    cursor?: StoryPanelWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` StoryPanels from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` StoryPanels.
     */
    skip?: number
    distinct?: StoryPanelScalarFieldEnum | StoryPanelScalarFieldEnum[]
  }

  /**
   * StoryPanel create
   */
  export type StoryPanelCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StoryPanel
     */
    select?: StoryPanelSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StoryPanelInclude<ExtArgs> | null
    /**
     * The data needed to create a StoryPanel.
     */
    data: XOR<StoryPanelCreateInput, StoryPanelUncheckedCreateInput>
  }

  /**
   * StoryPanel createMany
   */
  export type StoryPanelCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many StoryPanels.
     */
    data: StoryPanelCreateManyInput | StoryPanelCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * StoryPanel createManyAndReturn
   */
  export type StoryPanelCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StoryPanel
     */
    select?: StoryPanelSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many StoryPanels.
     */
    data: StoryPanelCreateManyInput | StoryPanelCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StoryPanelIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * StoryPanel update
   */
  export type StoryPanelUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StoryPanel
     */
    select?: StoryPanelSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StoryPanelInclude<ExtArgs> | null
    /**
     * The data needed to update a StoryPanel.
     */
    data: XOR<StoryPanelUpdateInput, StoryPanelUncheckedUpdateInput>
    /**
     * Choose, which StoryPanel to update.
     */
    where: StoryPanelWhereUniqueInput
  }

  /**
   * StoryPanel updateMany
   */
  export type StoryPanelUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update StoryPanels.
     */
    data: XOR<StoryPanelUpdateManyMutationInput, StoryPanelUncheckedUpdateManyInput>
    /**
     * Filter which StoryPanels to update
     */
    where?: StoryPanelWhereInput
  }

  /**
   * StoryPanel upsert
   */
  export type StoryPanelUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StoryPanel
     */
    select?: StoryPanelSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StoryPanelInclude<ExtArgs> | null
    /**
     * The filter to search for the StoryPanel to update in case it exists.
     */
    where: StoryPanelWhereUniqueInput
    /**
     * In case the StoryPanel found by the `where` argument doesn't exist, create a new StoryPanel with this data.
     */
    create: XOR<StoryPanelCreateInput, StoryPanelUncheckedCreateInput>
    /**
     * In case the StoryPanel was found with the provided `where` argument, update it with this data.
     */
    update: XOR<StoryPanelUpdateInput, StoryPanelUncheckedUpdateInput>
  }

  /**
   * StoryPanel delete
   */
  export type StoryPanelDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StoryPanel
     */
    select?: StoryPanelSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StoryPanelInclude<ExtArgs> | null
    /**
     * Filter which StoryPanel to delete.
     */
    where: StoryPanelWhereUniqueInput
  }

  /**
   * StoryPanel deleteMany
   */
  export type StoryPanelDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which StoryPanels to delete
     */
    where?: StoryPanelWhereInput
  }

  /**
   * StoryPanel without action
   */
  export type StoryPanelDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StoryPanel
     */
    select?: StoryPanelSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StoryPanelInclude<ExtArgs> | null
  }


  /**
   * Model StorySubmission
   */

  export type AggregateStorySubmission = {
    _count: StorySubmissionCountAggregateOutputType | null
    _min: StorySubmissionMinAggregateOutputType | null
    _max: StorySubmissionMaxAggregateOutputType | null
  }

  export type StorySubmissionMinAggregateOutputType = {
    id: string | null
    storyId: string | null
    studentName: string | null
    status: $Enums.StorySubmissionStatus | null
    createdAt: Date | null
  }

  export type StorySubmissionMaxAggregateOutputType = {
    id: string | null
    storyId: string | null
    studentName: string | null
    status: $Enums.StorySubmissionStatus | null
    createdAt: Date | null
  }

  export type StorySubmissionCountAggregateOutputType = {
    id: number
    storyId: number
    studentName: number
    status: number
    createdAt: number
    _all: number
  }


  export type StorySubmissionMinAggregateInputType = {
    id?: true
    storyId?: true
    studentName?: true
    status?: true
    createdAt?: true
  }

  export type StorySubmissionMaxAggregateInputType = {
    id?: true
    storyId?: true
    studentName?: true
    status?: true
    createdAt?: true
  }

  export type StorySubmissionCountAggregateInputType = {
    id?: true
    storyId?: true
    studentName?: true
    status?: true
    createdAt?: true
    _all?: true
  }

  export type StorySubmissionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which StorySubmission to aggregate.
     */
    where?: StorySubmissionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of StorySubmissions to fetch.
     */
    orderBy?: StorySubmissionOrderByWithRelationInput | StorySubmissionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: StorySubmissionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` StorySubmissions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` StorySubmissions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned StorySubmissions
    **/
    _count?: true | StorySubmissionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: StorySubmissionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: StorySubmissionMaxAggregateInputType
  }

  export type GetStorySubmissionAggregateType<T extends StorySubmissionAggregateArgs> = {
        [P in keyof T & keyof AggregateStorySubmission]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateStorySubmission[P]>
      : GetScalarType<T[P], AggregateStorySubmission[P]>
  }




  export type StorySubmissionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: StorySubmissionWhereInput
    orderBy?: StorySubmissionOrderByWithAggregationInput | StorySubmissionOrderByWithAggregationInput[]
    by: StorySubmissionScalarFieldEnum[] | StorySubmissionScalarFieldEnum
    having?: StorySubmissionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: StorySubmissionCountAggregateInputType | true
    _min?: StorySubmissionMinAggregateInputType
    _max?: StorySubmissionMaxAggregateInputType
  }

  export type StorySubmissionGroupByOutputType = {
    id: string
    storyId: string
    studentName: string
    status: $Enums.StorySubmissionStatus
    createdAt: Date
    _count: StorySubmissionCountAggregateOutputType | null
    _min: StorySubmissionMinAggregateOutputType | null
    _max: StorySubmissionMaxAggregateOutputType | null
  }

  type GetStorySubmissionGroupByPayload<T extends StorySubmissionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<StorySubmissionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof StorySubmissionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], StorySubmissionGroupByOutputType[P]>
            : GetScalarType<T[P], StorySubmissionGroupByOutputType[P]>
        }
      >
    >


  export type StorySubmissionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    storyId?: boolean
    studentName?: boolean
    status?: boolean
    createdAt?: boolean
    recordings?: boolean | StorySubmission$recordingsArgs<ExtArgs>
    story?: boolean | StoryDefaultArgs<ExtArgs>
    _count?: boolean | StorySubmissionCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["storySubmission"]>

  export type StorySubmissionSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    storyId?: boolean
    studentName?: boolean
    status?: boolean
    createdAt?: boolean
    story?: boolean | StoryDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["storySubmission"]>

  export type StorySubmissionSelectScalar = {
    id?: boolean
    storyId?: boolean
    studentName?: boolean
    status?: boolean
    createdAt?: boolean
  }

  export type StorySubmissionInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    recordings?: boolean | StorySubmission$recordingsArgs<ExtArgs>
    story?: boolean | StoryDefaultArgs<ExtArgs>
    _count?: boolean | StorySubmissionCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type StorySubmissionIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    story?: boolean | StoryDefaultArgs<ExtArgs>
  }

  export type $StorySubmissionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "StorySubmission"
    objects: {
      recordings: Prisma.$StoryRecordingPayload<ExtArgs>[]
      story: Prisma.$StoryPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      storyId: string
      studentName: string
      status: $Enums.StorySubmissionStatus
      createdAt: Date
    }, ExtArgs["result"]["storySubmission"]>
    composites: {}
  }

  type StorySubmissionGetPayload<S extends boolean | null | undefined | StorySubmissionDefaultArgs> = $Result.GetResult<Prisma.$StorySubmissionPayload, S>

  type StorySubmissionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<StorySubmissionFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: StorySubmissionCountAggregateInputType | true
    }

  export interface StorySubmissionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['StorySubmission'], meta: { name: 'StorySubmission' } }
    /**
     * Find zero or one StorySubmission that matches the filter.
     * @param {StorySubmissionFindUniqueArgs} args - Arguments to find a StorySubmission
     * @example
     * // Get one StorySubmission
     * const storySubmission = await prisma.storySubmission.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends StorySubmissionFindUniqueArgs>(args: SelectSubset<T, StorySubmissionFindUniqueArgs<ExtArgs>>): Prisma__StorySubmissionClient<$Result.GetResult<Prisma.$StorySubmissionPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one StorySubmission that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {StorySubmissionFindUniqueOrThrowArgs} args - Arguments to find a StorySubmission
     * @example
     * // Get one StorySubmission
     * const storySubmission = await prisma.storySubmission.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends StorySubmissionFindUniqueOrThrowArgs>(args: SelectSubset<T, StorySubmissionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__StorySubmissionClient<$Result.GetResult<Prisma.$StorySubmissionPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first StorySubmission that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StorySubmissionFindFirstArgs} args - Arguments to find a StorySubmission
     * @example
     * // Get one StorySubmission
     * const storySubmission = await prisma.storySubmission.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends StorySubmissionFindFirstArgs>(args?: SelectSubset<T, StorySubmissionFindFirstArgs<ExtArgs>>): Prisma__StorySubmissionClient<$Result.GetResult<Prisma.$StorySubmissionPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first StorySubmission that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StorySubmissionFindFirstOrThrowArgs} args - Arguments to find a StorySubmission
     * @example
     * // Get one StorySubmission
     * const storySubmission = await prisma.storySubmission.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends StorySubmissionFindFirstOrThrowArgs>(args?: SelectSubset<T, StorySubmissionFindFirstOrThrowArgs<ExtArgs>>): Prisma__StorySubmissionClient<$Result.GetResult<Prisma.$StorySubmissionPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more StorySubmissions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StorySubmissionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all StorySubmissions
     * const storySubmissions = await prisma.storySubmission.findMany()
     * 
     * // Get first 10 StorySubmissions
     * const storySubmissions = await prisma.storySubmission.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const storySubmissionWithIdOnly = await prisma.storySubmission.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends StorySubmissionFindManyArgs>(args?: SelectSubset<T, StorySubmissionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$StorySubmissionPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a StorySubmission.
     * @param {StorySubmissionCreateArgs} args - Arguments to create a StorySubmission.
     * @example
     * // Create one StorySubmission
     * const StorySubmission = await prisma.storySubmission.create({
     *   data: {
     *     // ... data to create a StorySubmission
     *   }
     * })
     * 
     */
    create<T extends StorySubmissionCreateArgs>(args: SelectSubset<T, StorySubmissionCreateArgs<ExtArgs>>): Prisma__StorySubmissionClient<$Result.GetResult<Prisma.$StorySubmissionPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many StorySubmissions.
     * @param {StorySubmissionCreateManyArgs} args - Arguments to create many StorySubmissions.
     * @example
     * // Create many StorySubmissions
     * const storySubmission = await prisma.storySubmission.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends StorySubmissionCreateManyArgs>(args?: SelectSubset<T, StorySubmissionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many StorySubmissions and returns the data saved in the database.
     * @param {StorySubmissionCreateManyAndReturnArgs} args - Arguments to create many StorySubmissions.
     * @example
     * // Create many StorySubmissions
     * const storySubmission = await prisma.storySubmission.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many StorySubmissions and only return the `id`
     * const storySubmissionWithIdOnly = await prisma.storySubmission.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends StorySubmissionCreateManyAndReturnArgs>(args?: SelectSubset<T, StorySubmissionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$StorySubmissionPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a StorySubmission.
     * @param {StorySubmissionDeleteArgs} args - Arguments to delete one StorySubmission.
     * @example
     * // Delete one StorySubmission
     * const StorySubmission = await prisma.storySubmission.delete({
     *   where: {
     *     // ... filter to delete one StorySubmission
     *   }
     * })
     * 
     */
    delete<T extends StorySubmissionDeleteArgs>(args: SelectSubset<T, StorySubmissionDeleteArgs<ExtArgs>>): Prisma__StorySubmissionClient<$Result.GetResult<Prisma.$StorySubmissionPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one StorySubmission.
     * @param {StorySubmissionUpdateArgs} args - Arguments to update one StorySubmission.
     * @example
     * // Update one StorySubmission
     * const storySubmission = await prisma.storySubmission.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends StorySubmissionUpdateArgs>(args: SelectSubset<T, StorySubmissionUpdateArgs<ExtArgs>>): Prisma__StorySubmissionClient<$Result.GetResult<Prisma.$StorySubmissionPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more StorySubmissions.
     * @param {StorySubmissionDeleteManyArgs} args - Arguments to filter StorySubmissions to delete.
     * @example
     * // Delete a few StorySubmissions
     * const { count } = await prisma.storySubmission.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends StorySubmissionDeleteManyArgs>(args?: SelectSubset<T, StorySubmissionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more StorySubmissions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StorySubmissionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many StorySubmissions
     * const storySubmission = await prisma.storySubmission.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends StorySubmissionUpdateManyArgs>(args: SelectSubset<T, StorySubmissionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one StorySubmission.
     * @param {StorySubmissionUpsertArgs} args - Arguments to update or create a StorySubmission.
     * @example
     * // Update or create a StorySubmission
     * const storySubmission = await prisma.storySubmission.upsert({
     *   create: {
     *     // ... data to create a StorySubmission
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the StorySubmission we want to update
     *   }
     * })
     */
    upsert<T extends StorySubmissionUpsertArgs>(args: SelectSubset<T, StorySubmissionUpsertArgs<ExtArgs>>): Prisma__StorySubmissionClient<$Result.GetResult<Prisma.$StorySubmissionPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of StorySubmissions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StorySubmissionCountArgs} args - Arguments to filter StorySubmissions to count.
     * @example
     * // Count the number of StorySubmissions
     * const count = await prisma.storySubmission.count({
     *   where: {
     *     // ... the filter for the StorySubmissions we want to count
     *   }
     * })
    **/
    count<T extends StorySubmissionCountArgs>(
      args?: Subset<T, StorySubmissionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], StorySubmissionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a StorySubmission.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StorySubmissionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends StorySubmissionAggregateArgs>(args: Subset<T, StorySubmissionAggregateArgs>): Prisma.PrismaPromise<GetStorySubmissionAggregateType<T>>

    /**
     * Group by StorySubmission.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StorySubmissionGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends StorySubmissionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: StorySubmissionGroupByArgs['orderBy'] }
        : { orderBy?: StorySubmissionGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, StorySubmissionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetStorySubmissionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the StorySubmission model
   */
  readonly fields: StorySubmissionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for StorySubmission.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__StorySubmissionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    recordings<T extends StorySubmission$recordingsArgs<ExtArgs> = {}>(args?: Subset<T, StorySubmission$recordingsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$StoryRecordingPayload<ExtArgs>, T, "findMany"> | Null>
    story<T extends StoryDefaultArgs<ExtArgs> = {}>(args?: Subset<T, StoryDefaultArgs<ExtArgs>>): Prisma__StoryClient<$Result.GetResult<Prisma.$StoryPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the StorySubmission model
   */ 
  interface StorySubmissionFieldRefs {
    readonly id: FieldRef<"StorySubmission", 'String'>
    readonly storyId: FieldRef<"StorySubmission", 'String'>
    readonly studentName: FieldRef<"StorySubmission", 'String'>
    readonly status: FieldRef<"StorySubmission", 'StorySubmissionStatus'>
    readonly createdAt: FieldRef<"StorySubmission", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * StorySubmission findUnique
   */
  export type StorySubmissionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StorySubmission
     */
    select?: StorySubmissionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StorySubmissionInclude<ExtArgs> | null
    /**
     * Filter, which StorySubmission to fetch.
     */
    where: StorySubmissionWhereUniqueInput
  }

  /**
   * StorySubmission findUniqueOrThrow
   */
  export type StorySubmissionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StorySubmission
     */
    select?: StorySubmissionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StorySubmissionInclude<ExtArgs> | null
    /**
     * Filter, which StorySubmission to fetch.
     */
    where: StorySubmissionWhereUniqueInput
  }

  /**
   * StorySubmission findFirst
   */
  export type StorySubmissionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StorySubmission
     */
    select?: StorySubmissionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StorySubmissionInclude<ExtArgs> | null
    /**
     * Filter, which StorySubmission to fetch.
     */
    where?: StorySubmissionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of StorySubmissions to fetch.
     */
    orderBy?: StorySubmissionOrderByWithRelationInput | StorySubmissionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for StorySubmissions.
     */
    cursor?: StorySubmissionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` StorySubmissions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` StorySubmissions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of StorySubmissions.
     */
    distinct?: StorySubmissionScalarFieldEnum | StorySubmissionScalarFieldEnum[]
  }

  /**
   * StorySubmission findFirstOrThrow
   */
  export type StorySubmissionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StorySubmission
     */
    select?: StorySubmissionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StorySubmissionInclude<ExtArgs> | null
    /**
     * Filter, which StorySubmission to fetch.
     */
    where?: StorySubmissionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of StorySubmissions to fetch.
     */
    orderBy?: StorySubmissionOrderByWithRelationInput | StorySubmissionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for StorySubmissions.
     */
    cursor?: StorySubmissionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` StorySubmissions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` StorySubmissions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of StorySubmissions.
     */
    distinct?: StorySubmissionScalarFieldEnum | StorySubmissionScalarFieldEnum[]
  }

  /**
   * StorySubmission findMany
   */
  export type StorySubmissionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StorySubmission
     */
    select?: StorySubmissionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StorySubmissionInclude<ExtArgs> | null
    /**
     * Filter, which StorySubmissions to fetch.
     */
    where?: StorySubmissionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of StorySubmissions to fetch.
     */
    orderBy?: StorySubmissionOrderByWithRelationInput | StorySubmissionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing StorySubmissions.
     */
    cursor?: StorySubmissionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` StorySubmissions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` StorySubmissions.
     */
    skip?: number
    distinct?: StorySubmissionScalarFieldEnum | StorySubmissionScalarFieldEnum[]
  }

  /**
   * StorySubmission create
   */
  export type StorySubmissionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StorySubmission
     */
    select?: StorySubmissionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StorySubmissionInclude<ExtArgs> | null
    /**
     * The data needed to create a StorySubmission.
     */
    data: XOR<StorySubmissionCreateInput, StorySubmissionUncheckedCreateInput>
  }

  /**
   * StorySubmission createMany
   */
  export type StorySubmissionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many StorySubmissions.
     */
    data: StorySubmissionCreateManyInput | StorySubmissionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * StorySubmission createManyAndReturn
   */
  export type StorySubmissionCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StorySubmission
     */
    select?: StorySubmissionSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many StorySubmissions.
     */
    data: StorySubmissionCreateManyInput | StorySubmissionCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StorySubmissionIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * StorySubmission update
   */
  export type StorySubmissionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StorySubmission
     */
    select?: StorySubmissionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StorySubmissionInclude<ExtArgs> | null
    /**
     * The data needed to update a StorySubmission.
     */
    data: XOR<StorySubmissionUpdateInput, StorySubmissionUncheckedUpdateInput>
    /**
     * Choose, which StorySubmission to update.
     */
    where: StorySubmissionWhereUniqueInput
  }

  /**
   * StorySubmission updateMany
   */
  export type StorySubmissionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update StorySubmissions.
     */
    data: XOR<StorySubmissionUpdateManyMutationInput, StorySubmissionUncheckedUpdateManyInput>
    /**
     * Filter which StorySubmissions to update
     */
    where?: StorySubmissionWhereInput
  }

  /**
   * StorySubmission upsert
   */
  export type StorySubmissionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StorySubmission
     */
    select?: StorySubmissionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StorySubmissionInclude<ExtArgs> | null
    /**
     * The filter to search for the StorySubmission to update in case it exists.
     */
    where: StorySubmissionWhereUniqueInput
    /**
     * In case the StorySubmission found by the `where` argument doesn't exist, create a new StorySubmission with this data.
     */
    create: XOR<StorySubmissionCreateInput, StorySubmissionUncheckedCreateInput>
    /**
     * In case the StorySubmission was found with the provided `where` argument, update it with this data.
     */
    update: XOR<StorySubmissionUpdateInput, StorySubmissionUncheckedUpdateInput>
  }

  /**
   * StorySubmission delete
   */
  export type StorySubmissionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StorySubmission
     */
    select?: StorySubmissionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StorySubmissionInclude<ExtArgs> | null
    /**
     * Filter which StorySubmission to delete.
     */
    where: StorySubmissionWhereUniqueInput
  }

  /**
   * StorySubmission deleteMany
   */
  export type StorySubmissionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which StorySubmissions to delete
     */
    where?: StorySubmissionWhereInput
  }

  /**
   * StorySubmission.recordings
   */
  export type StorySubmission$recordingsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StoryRecording
     */
    select?: StoryRecordingSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StoryRecordingInclude<ExtArgs> | null
    where?: StoryRecordingWhereInput
    orderBy?: StoryRecordingOrderByWithRelationInput | StoryRecordingOrderByWithRelationInput[]
    cursor?: StoryRecordingWhereUniqueInput
    take?: number
    skip?: number
    distinct?: StoryRecordingScalarFieldEnum | StoryRecordingScalarFieldEnum[]
  }

  /**
   * StorySubmission without action
   */
  export type StorySubmissionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StorySubmission
     */
    select?: StorySubmissionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StorySubmissionInclude<ExtArgs> | null
  }


  /**
   * Model StoryRecording
   */

  export type AggregateStoryRecording = {
    _count: StoryRecordingCountAggregateOutputType | null
    _avg: StoryRecordingAvgAggregateOutputType | null
    _sum: StoryRecordingSumAggregateOutputType | null
    _min: StoryRecordingMinAggregateOutputType | null
    _max: StoryRecordingMaxAggregateOutputType | null
  }

  export type StoryRecordingAvgAggregateOutputType = {
    panelOrder: number | null
    durationMs: number | null
  }

  export type StoryRecordingSumAggregateOutputType = {
    panelOrder: number | null
    durationMs: number | null
  }

  export type StoryRecordingMinAggregateOutputType = {
    id: string | null
    submissionId: string | null
    panelOrder: number | null
    audioUrl: string | null
    mimeType: string | null
    durationMs: number | null
  }

  export type StoryRecordingMaxAggregateOutputType = {
    id: string | null
    submissionId: string | null
    panelOrder: number | null
    audioUrl: string | null
    mimeType: string | null
    durationMs: number | null
  }

  export type StoryRecordingCountAggregateOutputType = {
    id: number
    submissionId: number
    panelOrder: number
    audioUrl: number
    mimeType: number
    durationMs: number
    envelope: number
    _all: number
  }


  export type StoryRecordingAvgAggregateInputType = {
    panelOrder?: true
    durationMs?: true
  }

  export type StoryRecordingSumAggregateInputType = {
    panelOrder?: true
    durationMs?: true
  }

  export type StoryRecordingMinAggregateInputType = {
    id?: true
    submissionId?: true
    panelOrder?: true
    audioUrl?: true
    mimeType?: true
    durationMs?: true
  }

  export type StoryRecordingMaxAggregateInputType = {
    id?: true
    submissionId?: true
    panelOrder?: true
    audioUrl?: true
    mimeType?: true
    durationMs?: true
  }

  export type StoryRecordingCountAggregateInputType = {
    id?: true
    submissionId?: true
    panelOrder?: true
    audioUrl?: true
    mimeType?: true
    durationMs?: true
    envelope?: true
    _all?: true
  }

  export type StoryRecordingAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which StoryRecording to aggregate.
     */
    where?: StoryRecordingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of StoryRecordings to fetch.
     */
    orderBy?: StoryRecordingOrderByWithRelationInput | StoryRecordingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: StoryRecordingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` StoryRecordings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` StoryRecordings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned StoryRecordings
    **/
    _count?: true | StoryRecordingCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: StoryRecordingAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: StoryRecordingSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: StoryRecordingMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: StoryRecordingMaxAggregateInputType
  }

  export type GetStoryRecordingAggregateType<T extends StoryRecordingAggregateArgs> = {
        [P in keyof T & keyof AggregateStoryRecording]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateStoryRecording[P]>
      : GetScalarType<T[P], AggregateStoryRecording[P]>
  }




  export type StoryRecordingGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: StoryRecordingWhereInput
    orderBy?: StoryRecordingOrderByWithAggregationInput | StoryRecordingOrderByWithAggregationInput[]
    by: StoryRecordingScalarFieldEnum[] | StoryRecordingScalarFieldEnum
    having?: StoryRecordingScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: StoryRecordingCountAggregateInputType | true
    _avg?: StoryRecordingAvgAggregateInputType
    _sum?: StoryRecordingSumAggregateInputType
    _min?: StoryRecordingMinAggregateInputType
    _max?: StoryRecordingMaxAggregateInputType
  }

  export type StoryRecordingGroupByOutputType = {
    id: string
    submissionId: string
    panelOrder: number
    audioUrl: string
    mimeType: string
    durationMs: number
    envelope: JsonValue | null
    _count: StoryRecordingCountAggregateOutputType | null
    _avg: StoryRecordingAvgAggregateOutputType | null
    _sum: StoryRecordingSumAggregateOutputType | null
    _min: StoryRecordingMinAggregateOutputType | null
    _max: StoryRecordingMaxAggregateOutputType | null
  }

  type GetStoryRecordingGroupByPayload<T extends StoryRecordingGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<StoryRecordingGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof StoryRecordingGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], StoryRecordingGroupByOutputType[P]>
            : GetScalarType<T[P], StoryRecordingGroupByOutputType[P]>
        }
      >
    >


  export type StoryRecordingSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    submissionId?: boolean
    panelOrder?: boolean
    audioUrl?: boolean
    mimeType?: boolean
    durationMs?: boolean
    envelope?: boolean
    submission?: boolean | StorySubmissionDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["storyRecording"]>

  export type StoryRecordingSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    submissionId?: boolean
    panelOrder?: boolean
    audioUrl?: boolean
    mimeType?: boolean
    durationMs?: boolean
    envelope?: boolean
    submission?: boolean | StorySubmissionDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["storyRecording"]>

  export type StoryRecordingSelectScalar = {
    id?: boolean
    submissionId?: boolean
    panelOrder?: boolean
    audioUrl?: boolean
    mimeType?: boolean
    durationMs?: boolean
    envelope?: boolean
  }

  export type StoryRecordingInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    submission?: boolean | StorySubmissionDefaultArgs<ExtArgs>
  }
  export type StoryRecordingIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    submission?: boolean | StorySubmissionDefaultArgs<ExtArgs>
  }

  export type $StoryRecordingPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "StoryRecording"
    objects: {
      submission: Prisma.$StorySubmissionPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      submissionId: string
      panelOrder: number
      audioUrl: string
      mimeType: string
      durationMs: number
      envelope: Prisma.JsonValue | null
    }, ExtArgs["result"]["storyRecording"]>
    composites: {}
  }

  type StoryRecordingGetPayload<S extends boolean | null | undefined | StoryRecordingDefaultArgs> = $Result.GetResult<Prisma.$StoryRecordingPayload, S>

  type StoryRecordingCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<StoryRecordingFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: StoryRecordingCountAggregateInputType | true
    }

  export interface StoryRecordingDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['StoryRecording'], meta: { name: 'StoryRecording' } }
    /**
     * Find zero or one StoryRecording that matches the filter.
     * @param {StoryRecordingFindUniqueArgs} args - Arguments to find a StoryRecording
     * @example
     * // Get one StoryRecording
     * const storyRecording = await prisma.storyRecording.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends StoryRecordingFindUniqueArgs>(args: SelectSubset<T, StoryRecordingFindUniqueArgs<ExtArgs>>): Prisma__StoryRecordingClient<$Result.GetResult<Prisma.$StoryRecordingPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one StoryRecording that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {StoryRecordingFindUniqueOrThrowArgs} args - Arguments to find a StoryRecording
     * @example
     * // Get one StoryRecording
     * const storyRecording = await prisma.storyRecording.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends StoryRecordingFindUniqueOrThrowArgs>(args: SelectSubset<T, StoryRecordingFindUniqueOrThrowArgs<ExtArgs>>): Prisma__StoryRecordingClient<$Result.GetResult<Prisma.$StoryRecordingPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first StoryRecording that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StoryRecordingFindFirstArgs} args - Arguments to find a StoryRecording
     * @example
     * // Get one StoryRecording
     * const storyRecording = await prisma.storyRecording.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends StoryRecordingFindFirstArgs>(args?: SelectSubset<T, StoryRecordingFindFirstArgs<ExtArgs>>): Prisma__StoryRecordingClient<$Result.GetResult<Prisma.$StoryRecordingPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first StoryRecording that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StoryRecordingFindFirstOrThrowArgs} args - Arguments to find a StoryRecording
     * @example
     * // Get one StoryRecording
     * const storyRecording = await prisma.storyRecording.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends StoryRecordingFindFirstOrThrowArgs>(args?: SelectSubset<T, StoryRecordingFindFirstOrThrowArgs<ExtArgs>>): Prisma__StoryRecordingClient<$Result.GetResult<Prisma.$StoryRecordingPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more StoryRecordings that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StoryRecordingFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all StoryRecordings
     * const storyRecordings = await prisma.storyRecording.findMany()
     * 
     * // Get first 10 StoryRecordings
     * const storyRecordings = await prisma.storyRecording.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const storyRecordingWithIdOnly = await prisma.storyRecording.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends StoryRecordingFindManyArgs>(args?: SelectSubset<T, StoryRecordingFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$StoryRecordingPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a StoryRecording.
     * @param {StoryRecordingCreateArgs} args - Arguments to create a StoryRecording.
     * @example
     * // Create one StoryRecording
     * const StoryRecording = await prisma.storyRecording.create({
     *   data: {
     *     // ... data to create a StoryRecording
     *   }
     * })
     * 
     */
    create<T extends StoryRecordingCreateArgs>(args: SelectSubset<T, StoryRecordingCreateArgs<ExtArgs>>): Prisma__StoryRecordingClient<$Result.GetResult<Prisma.$StoryRecordingPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many StoryRecordings.
     * @param {StoryRecordingCreateManyArgs} args - Arguments to create many StoryRecordings.
     * @example
     * // Create many StoryRecordings
     * const storyRecording = await prisma.storyRecording.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends StoryRecordingCreateManyArgs>(args?: SelectSubset<T, StoryRecordingCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many StoryRecordings and returns the data saved in the database.
     * @param {StoryRecordingCreateManyAndReturnArgs} args - Arguments to create many StoryRecordings.
     * @example
     * // Create many StoryRecordings
     * const storyRecording = await prisma.storyRecording.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many StoryRecordings and only return the `id`
     * const storyRecordingWithIdOnly = await prisma.storyRecording.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends StoryRecordingCreateManyAndReturnArgs>(args?: SelectSubset<T, StoryRecordingCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$StoryRecordingPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a StoryRecording.
     * @param {StoryRecordingDeleteArgs} args - Arguments to delete one StoryRecording.
     * @example
     * // Delete one StoryRecording
     * const StoryRecording = await prisma.storyRecording.delete({
     *   where: {
     *     // ... filter to delete one StoryRecording
     *   }
     * })
     * 
     */
    delete<T extends StoryRecordingDeleteArgs>(args: SelectSubset<T, StoryRecordingDeleteArgs<ExtArgs>>): Prisma__StoryRecordingClient<$Result.GetResult<Prisma.$StoryRecordingPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one StoryRecording.
     * @param {StoryRecordingUpdateArgs} args - Arguments to update one StoryRecording.
     * @example
     * // Update one StoryRecording
     * const storyRecording = await prisma.storyRecording.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends StoryRecordingUpdateArgs>(args: SelectSubset<T, StoryRecordingUpdateArgs<ExtArgs>>): Prisma__StoryRecordingClient<$Result.GetResult<Prisma.$StoryRecordingPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more StoryRecordings.
     * @param {StoryRecordingDeleteManyArgs} args - Arguments to filter StoryRecordings to delete.
     * @example
     * // Delete a few StoryRecordings
     * const { count } = await prisma.storyRecording.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends StoryRecordingDeleteManyArgs>(args?: SelectSubset<T, StoryRecordingDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more StoryRecordings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StoryRecordingUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many StoryRecordings
     * const storyRecording = await prisma.storyRecording.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends StoryRecordingUpdateManyArgs>(args: SelectSubset<T, StoryRecordingUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one StoryRecording.
     * @param {StoryRecordingUpsertArgs} args - Arguments to update or create a StoryRecording.
     * @example
     * // Update or create a StoryRecording
     * const storyRecording = await prisma.storyRecording.upsert({
     *   create: {
     *     // ... data to create a StoryRecording
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the StoryRecording we want to update
     *   }
     * })
     */
    upsert<T extends StoryRecordingUpsertArgs>(args: SelectSubset<T, StoryRecordingUpsertArgs<ExtArgs>>): Prisma__StoryRecordingClient<$Result.GetResult<Prisma.$StoryRecordingPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of StoryRecordings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StoryRecordingCountArgs} args - Arguments to filter StoryRecordings to count.
     * @example
     * // Count the number of StoryRecordings
     * const count = await prisma.storyRecording.count({
     *   where: {
     *     // ... the filter for the StoryRecordings we want to count
     *   }
     * })
    **/
    count<T extends StoryRecordingCountArgs>(
      args?: Subset<T, StoryRecordingCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], StoryRecordingCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a StoryRecording.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StoryRecordingAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends StoryRecordingAggregateArgs>(args: Subset<T, StoryRecordingAggregateArgs>): Prisma.PrismaPromise<GetStoryRecordingAggregateType<T>>

    /**
     * Group by StoryRecording.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StoryRecordingGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends StoryRecordingGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: StoryRecordingGroupByArgs['orderBy'] }
        : { orderBy?: StoryRecordingGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, StoryRecordingGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetStoryRecordingGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the StoryRecording model
   */
  readonly fields: StoryRecordingFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for StoryRecording.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__StoryRecordingClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    submission<T extends StorySubmissionDefaultArgs<ExtArgs> = {}>(args?: Subset<T, StorySubmissionDefaultArgs<ExtArgs>>): Prisma__StorySubmissionClient<$Result.GetResult<Prisma.$StorySubmissionPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the StoryRecording model
   */ 
  interface StoryRecordingFieldRefs {
    readonly id: FieldRef<"StoryRecording", 'String'>
    readonly submissionId: FieldRef<"StoryRecording", 'String'>
    readonly panelOrder: FieldRef<"StoryRecording", 'Int'>
    readonly audioUrl: FieldRef<"StoryRecording", 'String'>
    readonly mimeType: FieldRef<"StoryRecording", 'String'>
    readonly durationMs: FieldRef<"StoryRecording", 'Int'>
    readonly envelope: FieldRef<"StoryRecording", 'Json'>
  }
    

  // Custom InputTypes
  /**
   * StoryRecording findUnique
   */
  export type StoryRecordingFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StoryRecording
     */
    select?: StoryRecordingSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StoryRecordingInclude<ExtArgs> | null
    /**
     * Filter, which StoryRecording to fetch.
     */
    where: StoryRecordingWhereUniqueInput
  }

  /**
   * StoryRecording findUniqueOrThrow
   */
  export type StoryRecordingFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StoryRecording
     */
    select?: StoryRecordingSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StoryRecordingInclude<ExtArgs> | null
    /**
     * Filter, which StoryRecording to fetch.
     */
    where: StoryRecordingWhereUniqueInput
  }

  /**
   * StoryRecording findFirst
   */
  export type StoryRecordingFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StoryRecording
     */
    select?: StoryRecordingSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StoryRecordingInclude<ExtArgs> | null
    /**
     * Filter, which StoryRecording to fetch.
     */
    where?: StoryRecordingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of StoryRecordings to fetch.
     */
    orderBy?: StoryRecordingOrderByWithRelationInput | StoryRecordingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for StoryRecordings.
     */
    cursor?: StoryRecordingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` StoryRecordings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` StoryRecordings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of StoryRecordings.
     */
    distinct?: StoryRecordingScalarFieldEnum | StoryRecordingScalarFieldEnum[]
  }

  /**
   * StoryRecording findFirstOrThrow
   */
  export type StoryRecordingFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StoryRecording
     */
    select?: StoryRecordingSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StoryRecordingInclude<ExtArgs> | null
    /**
     * Filter, which StoryRecording to fetch.
     */
    where?: StoryRecordingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of StoryRecordings to fetch.
     */
    orderBy?: StoryRecordingOrderByWithRelationInput | StoryRecordingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for StoryRecordings.
     */
    cursor?: StoryRecordingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` StoryRecordings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` StoryRecordings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of StoryRecordings.
     */
    distinct?: StoryRecordingScalarFieldEnum | StoryRecordingScalarFieldEnum[]
  }

  /**
   * StoryRecording findMany
   */
  export type StoryRecordingFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StoryRecording
     */
    select?: StoryRecordingSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StoryRecordingInclude<ExtArgs> | null
    /**
     * Filter, which StoryRecordings to fetch.
     */
    where?: StoryRecordingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of StoryRecordings to fetch.
     */
    orderBy?: StoryRecordingOrderByWithRelationInput | StoryRecordingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing StoryRecordings.
     */
    cursor?: StoryRecordingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` StoryRecordings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` StoryRecordings.
     */
    skip?: number
    distinct?: StoryRecordingScalarFieldEnum | StoryRecordingScalarFieldEnum[]
  }

  /**
   * StoryRecording create
   */
  export type StoryRecordingCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StoryRecording
     */
    select?: StoryRecordingSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StoryRecordingInclude<ExtArgs> | null
    /**
     * The data needed to create a StoryRecording.
     */
    data: XOR<StoryRecordingCreateInput, StoryRecordingUncheckedCreateInput>
  }

  /**
   * StoryRecording createMany
   */
  export type StoryRecordingCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many StoryRecordings.
     */
    data: StoryRecordingCreateManyInput | StoryRecordingCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * StoryRecording createManyAndReturn
   */
  export type StoryRecordingCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StoryRecording
     */
    select?: StoryRecordingSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many StoryRecordings.
     */
    data: StoryRecordingCreateManyInput | StoryRecordingCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StoryRecordingIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * StoryRecording update
   */
  export type StoryRecordingUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StoryRecording
     */
    select?: StoryRecordingSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StoryRecordingInclude<ExtArgs> | null
    /**
     * The data needed to update a StoryRecording.
     */
    data: XOR<StoryRecordingUpdateInput, StoryRecordingUncheckedUpdateInput>
    /**
     * Choose, which StoryRecording to update.
     */
    where: StoryRecordingWhereUniqueInput
  }

  /**
   * StoryRecording updateMany
   */
  export type StoryRecordingUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update StoryRecordings.
     */
    data: XOR<StoryRecordingUpdateManyMutationInput, StoryRecordingUncheckedUpdateManyInput>
    /**
     * Filter which StoryRecordings to update
     */
    where?: StoryRecordingWhereInput
  }

  /**
   * StoryRecording upsert
   */
  export type StoryRecordingUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StoryRecording
     */
    select?: StoryRecordingSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StoryRecordingInclude<ExtArgs> | null
    /**
     * The filter to search for the StoryRecording to update in case it exists.
     */
    where: StoryRecordingWhereUniqueInput
    /**
     * In case the StoryRecording found by the `where` argument doesn't exist, create a new StoryRecording with this data.
     */
    create: XOR<StoryRecordingCreateInput, StoryRecordingUncheckedCreateInput>
    /**
     * In case the StoryRecording was found with the provided `where` argument, update it with this data.
     */
    update: XOR<StoryRecordingUpdateInput, StoryRecordingUncheckedUpdateInput>
  }

  /**
   * StoryRecording delete
   */
  export type StoryRecordingDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StoryRecording
     */
    select?: StoryRecordingSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StoryRecordingInclude<ExtArgs> | null
    /**
     * Filter which StoryRecording to delete.
     */
    where: StoryRecordingWhereUniqueInput
  }

  /**
   * StoryRecording deleteMany
   */
  export type StoryRecordingDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which StoryRecordings to delete
     */
    where?: StoryRecordingWhereInput
  }

  /**
   * StoryRecording without action
   */
  export type StoryRecordingDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StoryRecording
     */
    select?: StoryRecordingSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StoryRecordingInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const QuizScalarFieldEnum: {
    id: 'id',
    title: 'title',
    description: 'description',
    imageUrl: 'imageUrl',
    quizType: 'quizType',
    tags: 'tags',
    statistics: 'statistics',
    defaultSettings: 'defaultSettings',
    authorId: 'authorId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type QuizScalarFieldEnum = (typeof QuizScalarFieldEnum)[keyof typeof QuizScalarFieldEnum]


  export const QuizLikeScalarFieldEnum: {
    id: 'id',
    quizId: 'quizId',
    userId: 'userId',
    createdAt: 'createdAt'
  };

  export type QuizLikeScalarFieldEnum = (typeof QuizLikeScalarFieldEnum)[keyof typeof QuizLikeScalarFieldEnum]


  export const QuizFavoriteScalarFieldEnum: {
    id: 'id',
    quizId: 'quizId',
    userId: 'userId',
    createdAt: 'createdAt'
  };

  export type QuizFavoriteScalarFieldEnum = (typeof QuizFavoriteScalarFieldEnum)[keyof typeof QuizFavoriteScalarFieldEnum]


  export const QuestionScalarFieldEnum: {
    id: 'id',
    question: 'question',
    imageUrl: 'imageUrl',
    answers: 'answers',
    correctAnswer: 'correctAnswer',
    type: 'type',
    quizId: 'quizId'
  };

  export type QuestionScalarFieldEnum = (typeof QuestionScalarFieldEnum)[keyof typeof QuestionScalarFieldEnum]


  export const StoredImageScalarFieldEnum: {
    id: 'id',
    filename: 'filename',
    originalUrl: 'originalUrl',
    blobUrl: 'blobUrl',
    mimeType: 'mimeType',
    fileSize: 'fileSize',
    width: 'width',
    height: 'height',
    searchTerm: 'searchTerm',
    tags: 'tags',
    pixabayId: 'pixabayId',
    pixabayUser: 'pixabayUser',
    usageCount: 'usageCount',
    lastUsedAt: 'lastUsedAt',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type StoredImageScalarFieldEnum = (typeof StoredImageScalarFieldEnum)[keyof typeof StoredImageScalarFieldEnum]


  export const TagScalarFieldEnum: {
    id: 'id',
    name: 'name',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type TagScalarFieldEnum = (typeof TagScalarFieldEnum)[keyof typeof TagScalarFieldEnum]


  export const StoryScalarFieldEnum: {
    id: 'id',
    authorId: 'authorId',
    title: 'title',
    topicPrompt: 'topicPrompt',
    tags: 'tags',
    storyType: 'storyType',
    characterSheet: 'characterSheet',
    artStyle: 'artStyle',
    exampleStory: 'exampleStory',
    showExampleToStudents: 'showExampleToStudents',
    status: 'status',
    shareToken: 'shareToken',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type StoryScalarFieldEnum = (typeof StoryScalarFieldEnum)[keyof typeof StoryScalarFieldEnum]


  export const StoryPanelScalarFieldEnum: {
    id: 'id',
    storyId: 'storyId',
    order: 'order',
    imageUrl: 'imageUrl',
    sceneDescription: 'sceneDescription',
    imagePrompt: 'imagePrompt',
    exampleSentence: 'exampleSentence',
    mouth: 'mouth'
  };

  export type StoryPanelScalarFieldEnum = (typeof StoryPanelScalarFieldEnum)[keyof typeof StoryPanelScalarFieldEnum]


  export const StorySubmissionScalarFieldEnum: {
    id: 'id',
    storyId: 'storyId',
    studentName: 'studentName',
    status: 'status',
    createdAt: 'createdAt'
  };

  export type StorySubmissionScalarFieldEnum = (typeof StorySubmissionScalarFieldEnum)[keyof typeof StorySubmissionScalarFieldEnum]


  export const StoryRecordingScalarFieldEnum: {
    id: 'id',
    submissionId: 'submissionId',
    panelOrder: 'panelOrder',
    audioUrl: 'audioUrl',
    mimeType: 'mimeType',
    durationMs: 'durationMs',
    envelope: 'envelope'
  };

  export type StoryRecordingScalarFieldEnum = (typeof StoryRecordingScalarFieldEnum)[keyof typeof StoryRecordingScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const NullableJsonNullValueInput: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull
  };

  export type NullableJsonNullValueInput = (typeof NullableJsonNullValueInput)[keyof typeof NullableJsonNullValueInput]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references 
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'QuestionType'
   */
  export type EnumQuestionTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QuestionType'>
    


  /**
   * Reference to a field of type 'QuestionType[]'
   */
  export type ListEnumQuestionTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QuestionType[]'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'StoryStatus'
   */
  export type EnumStoryStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'StoryStatus'>
    


  /**
   * Reference to a field of type 'StoryStatus[]'
   */
  export type ListEnumStoryStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'StoryStatus[]'>
    


  /**
   * Reference to a field of type 'StorySubmissionStatus'
   */
  export type EnumStorySubmissionStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'StorySubmissionStatus'>
    


  /**
   * Reference to a field of type 'StorySubmissionStatus[]'
   */
  export type ListEnumStorySubmissionStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'StorySubmissionStatus[]'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    
  /**
   * Deep Input Types
   */


  export type QuizWhereInput = {
    AND?: QuizWhereInput | QuizWhereInput[]
    OR?: QuizWhereInput[]
    NOT?: QuizWhereInput | QuizWhereInput[]
    id?: StringFilter<"Quiz"> | string
    title?: StringFilter<"Quiz"> | string
    description?: StringNullableFilter<"Quiz"> | string | null
    imageUrl?: StringNullableFilter<"Quiz"> | string | null
    quizType?: EnumQuestionTypeFilter<"Quiz"> | $Enums.QuestionType
    tags?: StringNullableListFilter<"Quiz">
    statistics?: JsonNullableFilter<"Quiz">
    defaultSettings?: JsonNullableFilter<"Quiz">
    authorId?: StringFilter<"Quiz"> | string
    createdAt?: DateTimeFilter<"Quiz"> | Date | string
    updatedAt?: DateTimeFilter<"Quiz"> | Date | string
    questions?: QuestionListRelationFilter
    likes?: QuizLikeListRelationFilter
    favorites?: QuizFavoriteListRelationFilter
  }

  export type QuizOrderByWithRelationInput = {
    id?: SortOrder
    title?: SortOrder
    description?: SortOrderInput | SortOrder
    imageUrl?: SortOrderInput | SortOrder
    quizType?: SortOrder
    tags?: SortOrder
    statistics?: SortOrderInput | SortOrder
    defaultSettings?: SortOrderInput | SortOrder
    authorId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    questions?: QuestionOrderByRelationAggregateInput
    likes?: QuizLikeOrderByRelationAggregateInput
    favorites?: QuizFavoriteOrderByRelationAggregateInput
  }

  export type QuizWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: QuizWhereInput | QuizWhereInput[]
    OR?: QuizWhereInput[]
    NOT?: QuizWhereInput | QuizWhereInput[]
    title?: StringFilter<"Quiz"> | string
    description?: StringNullableFilter<"Quiz"> | string | null
    imageUrl?: StringNullableFilter<"Quiz"> | string | null
    quizType?: EnumQuestionTypeFilter<"Quiz"> | $Enums.QuestionType
    tags?: StringNullableListFilter<"Quiz">
    statistics?: JsonNullableFilter<"Quiz">
    defaultSettings?: JsonNullableFilter<"Quiz">
    authorId?: StringFilter<"Quiz"> | string
    createdAt?: DateTimeFilter<"Quiz"> | Date | string
    updatedAt?: DateTimeFilter<"Quiz"> | Date | string
    questions?: QuestionListRelationFilter
    likes?: QuizLikeListRelationFilter
    favorites?: QuizFavoriteListRelationFilter
  }, "id">

  export type QuizOrderByWithAggregationInput = {
    id?: SortOrder
    title?: SortOrder
    description?: SortOrderInput | SortOrder
    imageUrl?: SortOrderInput | SortOrder
    quizType?: SortOrder
    tags?: SortOrder
    statistics?: SortOrderInput | SortOrder
    defaultSettings?: SortOrderInput | SortOrder
    authorId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: QuizCountOrderByAggregateInput
    _max?: QuizMaxOrderByAggregateInput
    _min?: QuizMinOrderByAggregateInput
  }

  export type QuizScalarWhereWithAggregatesInput = {
    AND?: QuizScalarWhereWithAggregatesInput | QuizScalarWhereWithAggregatesInput[]
    OR?: QuizScalarWhereWithAggregatesInput[]
    NOT?: QuizScalarWhereWithAggregatesInput | QuizScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Quiz"> | string
    title?: StringWithAggregatesFilter<"Quiz"> | string
    description?: StringNullableWithAggregatesFilter<"Quiz"> | string | null
    imageUrl?: StringNullableWithAggregatesFilter<"Quiz"> | string | null
    quizType?: EnumQuestionTypeWithAggregatesFilter<"Quiz"> | $Enums.QuestionType
    tags?: StringNullableListFilter<"Quiz">
    statistics?: JsonNullableWithAggregatesFilter<"Quiz">
    defaultSettings?: JsonNullableWithAggregatesFilter<"Quiz">
    authorId?: StringWithAggregatesFilter<"Quiz"> | string
    createdAt?: DateTimeWithAggregatesFilter<"Quiz"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Quiz"> | Date | string
  }

  export type QuizLikeWhereInput = {
    AND?: QuizLikeWhereInput | QuizLikeWhereInput[]
    OR?: QuizLikeWhereInput[]
    NOT?: QuizLikeWhereInput | QuizLikeWhereInput[]
    id?: StringFilter<"QuizLike"> | string
    quizId?: StringFilter<"QuizLike"> | string
    userId?: StringFilter<"QuizLike"> | string
    createdAt?: DateTimeFilter<"QuizLike"> | Date | string
    quiz?: XOR<QuizRelationFilter, QuizWhereInput>
  }

  export type QuizLikeOrderByWithRelationInput = {
    id?: SortOrder
    quizId?: SortOrder
    userId?: SortOrder
    createdAt?: SortOrder
    quiz?: QuizOrderByWithRelationInput
  }

  export type QuizLikeWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    quizId_userId?: QuizLikeQuizIdUserIdCompoundUniqueInput
    AND?: QuizLikeWhereInput | QuizLikeWhereInput[]
    OR?: QuizLikeWhereInput[]
    NOT?: QuizLikeWhereInput | QuizLikeWhereInput[]
    quizId?: StringFilter<"QuizLike"> | string
    userId?: StringFilter<"QuizLike"> | string
    createdAt?: DateTimeFilter<"QuizLike"> | Date | string
    quiz?: XOR<QuizRelationFilter, QuizWhereInput>
  }, "id" | "quizId_userId">

  export type QuizLikeOrderByWithAggregationInput = {
    id?: SortOrder
    quizId?: SortOrder
    userId?: SortOrder
    createdAt?: SortOrder
    _count?: QuizLikeCountOrderByAggregateInput
    _max?: QuizLikeMaxOrderByAggregateInput
    _min?: QuizLikeMinOrderByAggregateInput
  }

  export type QuizLikeScalarWhereWithAggregatesInput = {
    AND?: QuizLikeScalarWhereWithAggregatesInput | QuizLikeScalarWhereWithAggregatesInput[]
    OR?: QuizLikeScalarWhereWithAggregatesInput[]
    NOT?: QuizLikeScalarWhereWithAggregatesInput | QuizLikeScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"QuizLike"> | string
    quizId?: StringWithAggregatesFilter<"QuizLike"> | string
    userId?: StringWithAggregatesFilter<"QuizLike"> | string
    createdAt?: DateTimeWithAggregatesFilter<"QuizLike"> | Date | string
  }

  export type QuizFavoriteWhereInput = {
    AND?: QuizFavoriteWhereInput | QuizFavoriteWhereInput[]
    OR?: QuizFavoriteWhereInput[]
    NOT?: QuizFavoriteWhereInput | QuizFavoriteWhereInput[]
    id?: StringFilter<"QuizFavorite"> | string
    quizId?: StringFilter<"QuizFavorite"> | string
    userId?: StringFilter<"QuizFavorite"> | string
    createdAt?: DateTimeFilter<"QuizFavorite"> | Date | string
    quiz?: XOR<QuizRelationFilter, QuizWhereInput>
  }

  export type QuizFavoriteOrderByWithRelationInput = {
    id?: SortOrder
    quizId?: SortOrder
    userId?: SortOrder
    createdAt?: SortOrder
    quiz?: QuizOrderByWithRelationInput
  }

  export type QuizFavoriteWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    quizId_userId?: QuizFavoriteQuizIdUserIdCompoundUniqueInput
    AND?: QuizFavoriteWhereInput | QuizFavoriteWhereInput[]
    OR?: QuizFavoriteWhereInput[]
    NOT?: QuizFavoriteWhereInput | QuizFavoriteWhereInput[]
    quizId?: StringFilter<"QuizFavorite"> | string
    userId?: StringFilter<"QuizFavorite"> | string
    createdAt?: DateTimeFilter<"QuizFavorite"> | Date | string
    quiz?: XOR<QuizRelationFilter, QuizWhereInput>
  }, "id" | "quizId_userId">

  export type QuizFavoriteOrderByWithAggregationInput = {
    id?: SortOrder
    quizId?: SortOrder
    userId?: SortOrder
    createdAt?: SortOrder
    _count?: QuizFavoriteCountOrderByAggregateInput
    _max?: QuizFavoriteMaxOrderByAggregateInput
    _min?: QuizFavoriteMinOrderByAggregateInput
  }

  export type QuizFavoriteScalarWhereWithAggregatesInput = {
    AND?: QuizFavoriteScalarWhereWithAggregatesInput | QuizFavoriteScalarWhereWithAggregatesInput[]
    OR?: QuizFavoriteScalarWhereWithAggregatesInput[]
    NOT?: QuizFavoriteScalarWhereWithAggregatesInput | QuizFavoriteScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"QuizFavorite"> | string
    quizId?: StringWithAggregatesFilter<"QuizFavorite"> | string
    userId?: StringWithAggregatesFilter<"QuizFavorite"> | string
    createdAt?: DateTimeWithAggregatesFilter<"QuizFavorite"> | Date | string
  }

  export type QuestionWhereInput = {
    AND?: QuestionWhereInput | QuestionWhereInput[]
    OR?: QuestionWhereInput[]
    NOT?: QuestionWhereInput | QuestionWhereInput[]
    id?: StringFilter<"Question"> | string
    question?: StringFilter<"Question"> | string
    imageUrl?: StringNullableFilter<"Question"> | string | null
    answers?: StringNullableListFilter<"Question">
    correctAnswer?: StringFilter<"Question"> | string
    type?: EnumQuestionTypeFilter<"Question"> | $Enums.QuestionType
    quizId?: StringNullableFilter<"Question"> | string | null
    quiz?: XOR<QuizNullableRelationFilter, QuizWhereInput> | null
  }

  export type QuestionOrderByWithRelationInput = {
    id?: SortOrder
    question?: SortOrder
    imageUrl?: SortOrderInput | SortOrder
    answers?: SortOrder
    correctAnswer?: SortOrder
    type?: SortOrder
    quizId?: SortOrderInput | SortOrder
    quiz?: QuizOrderByWithRelationInput
  }

  export type QuestionWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: QuestionWhereInput | QuestionWhereInput[]
    OR?: QuestionWhereInput[]
    NOT?: QuestionWhereInput | QuestionWhereInput[]
    question?: StringFilter<"Question"> | string
    imageUrl?: StringNullableFilter<"Question"> | string | null
    answers?: StringNullableListFilter<"Question">
    correctAnswer?: StringFilter<"Question"> | string
    type?: EnumQuestionTypeFilter<"Question"> | $Enums.QuestionType
    quizId?: StringNullableFilter<"Question"> | string | null
    quiz?: XOR<QuizNullableRelationFilter, QuizWhereInput> | null
  }, "id">

  export type QuestionOrderByWithAggregationInput = {
    id?: SortOrder
    question?: SortOrder
    imageUrl?: SortOrderInput | SortOrder
    answers?: SortOrder
    correctAnswer?: SortOrder
    type?: SortOrder
    quizId?: SortOrderInput | SortOrder
    _count?: QuestionCountOrderByAggregateInput
    _max?: QuestionMaxOrderByAggregateInput
    _min?: QuestionMinOrderByAggregateInput
  }

  export type QuestionScalarWhereWithAggregatesInput = {
    AND?: QuestionScalarWhereWithAggregatesInput | QuestionScalarWhereWithAggregatesInput[]
    OR?: QuestionScalarWhereWithAggregatesInput[]
    NOT?: QuestionScalarWhereWithAggregatesInput | QuestionScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Question"> | string
    question?: StringWithAggregatesFilter<"Question"> | string
    imageUrl?: StringNullableWithAggregatesFilter<"Question"> | string | null
    answers?: StringNullableListFilter<"Question">
    correctAnswer?: StringWithAggregatesFilter<"Question"> | string
    type?: EnumQuestionTypeWithAggregatesFilter<"Question"> | $Enums.QuestionType
    quizId?: StringNullableWithAggregatesFilter<"Question"> | string | null
  }

  export type StoredImageWhereInput = {
    AND?: StoredImageWhereInput | StoredImageWhereInput[]
    OR?: StoredImageWhereInput[]
    NOT?: StoredImageWhereInput | StoredImageWhereInput[]
    id?: StringFilter<"StoredImage"> | string
    filename?: StringFilter<"StoredImage"> | string
    originalUrl?: StringFilter<"StoredImage"> | string
    blobUrl?: StringFilter<"StoredImage"> | string
    mimeType?: StringFilter<"StoredImage"> | string
    fileSize?: IntFilter<"StoredImage"> | number
    width?: IntFilter<"StoredImage"> | number
    height?: IntFilter<"StoredImage"> | number
    searchTerm?: StringNullableFilter<"StoredImage"> | string | null
    tags?: StringNullableListFilter<"StoredImage">
    pixabayId?: IntFilter<"StoredImage"> | number
    pixabayUser?: StringNullableFilter<"StoredImage"> | string | null
    usageCount?: IntFilter<"StoredImage"> | number
    lastUsedAt?: DateTimeNullableFilter<"StoredImage"> | Date | string | null
    createdAt?: DateTimeFilter<"StoredImage"> | Date | string
    updatedAt?: DateTimeFilter<"StoredImage"> | Date | string
  }

  export type StoredImageOrderByWithRelationInput = {
    id?: SortOrder
    filename?: SortOrder
    originalUrl?: SortOrder
    blobUrl?: SortOrder
    mimeType?: SortOrder
    fileSize?: SortOrder
    width?: SortOrder
    height?: SortOrder
    searchTerm?: SortOrderInput | SortOrder
    tags?: SortOrder
    pixabayId?: SortOrder
    pixabayUser?: SortOrderInput | SortOrder
    usageCount?: SortOrder
    lastUsedAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type StoredImageWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    pixabayId?: number
    AND?: StoredImageWhereInput | StoredImageWhereInput[]
    OR?: StoredImageWhereInput[]
    NOT?: StoredImageWhereInput | StoredImageWhereInput[]
    filename?: StringFilter<"StoredImage"> | string
    originalUrl?: StringFilter<"StoredImage"> | string
    blobUrl?: StringFilter<"StoredImage"> | string
    mimeType?: StringFilter<"StoredImage"> | string
    fileSize?: IntFilter<"StoredImage"> | number
    width?: IntFilter<"StoredImage"> | number
    height?: IntFilter<"StoredImage"> | number
    searchTerm?: StringNullableFilter<"StoredImage"> | string | null
    tags?: StringNullableListFilter<"StoredImage">
    pixabayUser?: StringNullableFilter<"StoredImage"> | string | null
    usageCount?: IntFilter<"StoredImage"> | number
    lastUsedAt?: DateTimeNullableFilter<"StoredImage"> | Date | string | null
    createdAt?: DateTimeFilter<"StoredImage"> | Date | string
    updatedAt?: DateTimeFilter<"StoredImage"> | Date | string
  }, "id" | "pixabayId">

  export type StoredImageOrderByWithAggregationInput = {
    id?: SortOrder
    filename?: SortOrder
    originalUrl?: SortOrder
    blobUrl?: SortOrder
    mimeType?: SortOrder
    fileSize?: SortOrder
    width?: SortOrder
    height?: SortOrder
    searchTerm?: SortOrderInput | SortOrder
    tags?: SortOrder
    pixabayId?: SortOrder
    pixabayUser?: SortOrderInput | SortOrder
    usageCount?: SortOrder
    lastUsedAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: StoredImageCountOrderByAggregateInput
    _avg?: StoredImageAvgOrderByAggregateInput
    _max?: StoredImageMaxOrderByAggregateInput
    _min?: StoredImageMinOrderByAggregateInput
    _sum?: StoredImageSumOrderByAggregateInput
  }

  export type StoredImageScalarWhereWithAggregatesInput = {
    AND?: StoredImageScalarWhereWithAggregatesInput | StoredImageScalarWhereWithAggregatesInput[]
    OR?: StoredImageScalarWhereWithAggregatesInput[]
    NOT?: StoredImageScalarWhereWithAggregatesInput | StoredImageScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"StoredImage"> | string
    filename?: StringWithAggregatesFilter<"StoredImage"> | string
    originalUrl?: StringWithAggregatesFilter<"StoredImage"> | string
    blobUrl?: StringWithAggregatesFilter<"StoredImage"> | string
    mimeType?: StringWithAggregatesFilter<"StoredImage"> | string
    fileSize?: IntWithAggregatesFilter<"StoredImage"> | number
    width?: IntWithAggregatesFilter<"StoredImage"> | number
    height?: IntWithAggregatesFilter<"StoredImage"> | number
    searchTerm?: StringNullableWithAggregatesFilter<"StoredImage"> | string | null
    tags?: StringNullableListFilter<"StoredImage">
    pixabayId?: IntWithAggregatesFilter<"StoredImage"> | number
    pixabayUser?: StringNullableWithAggregatesFilter<"StoredImage"> | string | null
    usageCount?: IntWithAggregatesFilter<"StoredImage"> | number
    lastUsedAt?: DateTimeNullableWithAggregatesFilter<"StoredImage"> | Date | string | null
    createdAt?: DateTimeWithAggregatesFilter<"StoredImage"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"StoredImage"> | Date | string
  }

  export type TagWhereInput = {
    AND?: TagWhereInput | TagWhereInput[]
    OR?: TagWhereInput[]
    NOT?: TagWhereInput | TagWhereInput[]
    id?: StringFilter<"Tag"> | string
    name?: StringFilter<"Tag"> | string
    createdAt?: DateTimeFilter<"Tag"> | Date | string
    updatedAt?: DateTimeFilter<"Tag"> | Date | string
  }

  export type TagOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TagWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    name?: string
    AND?: TagWhereInput | TagWhereInput[]
    OR?: TagWhereInput[]
    NOT?: TagWhereInput | TagWhereInput[]
    createdAt?: DateTimeFilter<"Tag"> | Date | string
    updatedAt?: DateTimeFilter<"Tag"> | Date | string
  }, "id" | "name">

  export type TagOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: TagCountOrderByAggregateInput
    _max?: TagMaxOrderByAggregateInput
    _min?: TagMinOrderByAggregateInput
  }

  export type TagScalarWhereWithAggregatesInput = {
    AND?: TagScalarWhereWithAggregatesInput | TagScalarWhereWithAggregatesInput[]
    OR?: TagScalarWhereWithAggregatesInput[]
    NOT?: TagScalarWhereWithAggregatesInput | TagScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Tag"> | string
    name?: StringWithAggregatesFilter<"Tag"> | string
    createdAt?: DateTimeWithAggregatesFilter<"Tag"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Tag"> | Date | string
  }

  export type StoryWhereInput = {
    AND?: StoryWhereInput | StoryWhereInput[]
    OR?: StoryWhereInput[]
    NOT?: StoryWhereInput | StoryWhereInput[]
    id?: StringFilter<"Story"> | string
    authorId?: StringFilter<"Story"> | string
    title?: StringFilter<"Story"> | string
    topicPrompt?: StringFilter<"Story"> | string
    tags?: StringNullableListFilter<"Story">
    storyType?: StringNullableFilter<"Story"> | string | null
    characterSheet?: StringNullableFilter<"Story"> | string | null
    artStyle?: StringNullableFilter<"Story"> | string | null
    exampleStory?: StringNullableFilter<"Story"> | string | null
    showExampleToStudents?: BoolFilter<"Story"> | boolean
    status?: EnumStoryStatusFilter<"Story"> | $Enums.StoryStatus
    shareToken?: StringFilter<"Story"> | string
    createdAt?: DateTimeFilter<"Story"> | Date | string
    updatedAt?: DateTimeFilter<"Story"> | Date | string
    panels?: StoryPanelListRelationFilter
    submissions?: StorySubmissionListRelationFilter
  }

  export type StoryOrderByWithRelationInput = {
    id?: SortOrder
    authorId?: SortOrder
    title?: SortOrder
    topicPrompt?: SortOrder
    tags?: SortOrder
    storyType?: SortOrderInput | SortOrder
    characterSheet?: SortOrderInput | SortOrder
    artStyle?: SortOrderInput | SortOrder
    exampleStory?: SortOrderInput | SortOrder
    showExampleToStudents?: SortOrder
    status?: SortOrder
    shareToken?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    panels?: StoryPanelOrderByRelationAggregateInput
    submissions?: StorySubmissionOrderByRelationAggregateInput
  }

  export type StoryWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    shareToken?: string
    AND?: StoryWhereInput | StoryWhereInput[]
    OR?: StoryWhereInput[]
    NOT?: StoryWhereInput | StoryWhereInput[]
    authorId?: StringFilter<"Story"> | string
    title?: StringFilter<"Story"> | string
    topicPrompt?: StringFilter<"Story"> | string
    tags?: StringNullableListFilter<"Story">
    storyType?: StringNullableFilter<"Story"> | string | null
    characterSheet?: StringNullableFilter<"Story"> | string | null
    artStyle?: StringNullableFilter<"Story"> | string | null
    exampleStory?: StringNullableFilter<"Story"> | string | null
    showExampleToStudents?: BoolFilter<"Story"> | boolean
    status?: EnumStoryStatusFilter<"Story"> | $Enums.StoryStatus
    createdAt?: DateTimeFilter<"Story"> | Date | string
    updatedAt?: DateTimeFilter<"Story"> | Date | string
    panels?: StoryPanelListRelationFilter
    submissions?: StorySubmissionListRelationFilter
  }, "id" | "shareToken">

  export type StoryOrderByWithAggregationInput = {
    id?: SortOrder
    authorId?: SortOrder
    title?: SortOrder
    topicPrompt?: SortOrder
    tags?: SortOrder
    storyType?: SortOrderInput | SortOrder
    characterSheet?: SortOrderInput | SortOrder
    artStyle?: SortOrderInput | SortOrder
    exampleStory?: SortOrderInput | SortOrder
    showExampleToStudents?: SortOrder
    status?: SortOrder
    shareToken?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: StoryCountOrderByAggregateInput
    _max?: StoryMaxOrderByAggregateInput
    _min?: StoryMinOrderByAggregateInput
  }

  export type StoryScalarWhereWithAggregatesInput = {
    AND?: StoryScalarWhereWithAggregatesInput | StoryScalarWhereWithAggregatesInput[]
    OR?: StoryScalarWhereWithAggregatesInput[]
    NOT?: StoryScalarWhereWithAggregatesInput | StoryScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Story"> | string
    authorId?: StringWithAggregatesFilter<"Story"> | string
    title?: StringWithAggregatesFilter<"Story"> | string
    topicPrompt?: StringWithAggregatesFilter<"Story"> | string
    tags?: StringNullableListFilter<"Story">
    storyType?: StringNullableWithAggregatesFilter<"Story"> | string | null
    characterSheet?: StringNullableWithAggregatesFilter<"Story"> | string | null
    artStyle?: StringNullableWithAggregatesFilter<"Story"> | string | null
    exampleStory?: StringNullableWithAggregatesFilter<"Story"> | string | null
    showExampleToStudents?: BoolWithAggregatesFilter<"Story"> | boolean
    status?: EnumStoryStatusWithAggregatesFilter<"Story"> | $Enums.StoryStatus
    shareToken?: StringWithAggregatesFilter<"Story"> | string
    createdAt?: DateTimeWithAggregatesFilter<"Story"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Story"> | Date | string
  }

  export type StoryPanelWhereInput = {
    AND?: StoryPanelWhereInput | StoryPanelWhereInput[]
    OR?: StoryPanelWhereInput[]
    NOT?: StoryPanelWhereInput | StoryPanelWhereInput[]
    id?: StringFilter<"StoryPanel"> | string
    storyId?: StringFilter<"StoryPanel"> | string
    order?: IntFilter<"StoryPanel"> | number
    imageUrl?: StringNullableFilter<"StoryPanel"> | string | null
    sceneDescription?: StringFilter<"StoryPanel"> | string
    imagePrompt?: StringNullableFilter<"StoryPanel"> | string | null
    exampleSentence?: StringNullableFilter<"StoryPanel"> | string | null
    mouth?: JsonNullableFilter<"StoryPanel">
    story?: XOR<StoryRelationFilter, StoryWhereInput>
  }

  export type StoryPanelOrderByWithRelationInput = {
    id?: SortOrder
    storyId?: SortOrder
    order?: SortOrder
    imageUrl?: SortOrderInput | SortOrder
    sceneDescription?: SortOrder
    imagePrompt?: SortOrderInput | SortOrder
    exampleSentence?: SortOrderInput | SortOrder
    mouth?: SortOrderInput | SortOrder
    story?: StoryOrderByWithRelationInput
  }

  export type StoryPanelWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    storyId_order?: StoryPanelStoryIdOrderCompoundUniqueInput
    AND?: StoryPanelWhereInput | StoryPanelWhereInput[]
    OR?: StoryPanelWhereInput[]
    NOT?: StoryPanelWhereInput | StoryPanelWhereInput[]
    storyId?: StringFilter<"StoryPanel"> | string
    order?: IntFilter<"StoryPanel"> | number
    imageUrl?: StringNullableFilter<"StoryPanel"> | string | null
    sceneDescription?: StringFilter<"StoryPanel"> | string
    imagePrompt?: StringNullableFilter<"StoryPanel"> | string | null
    exampleSentence?: StringNullableFilter<"StoryPanel"> | string | null
    mouth?: JsonNullableFilter<"StoryPanel">
    story?: XOR<StoryRelationFilter, StoryWhereInput>
  }, "id" | "storyId_order">

  export type StoryPanelOrderByWithAggregationInput = {
    id?: SortOrder
    storyId?: SortOrder
    order?: SortOrder
    imageUrl?: SortOrderInput | SortOrder
    sceneDescription?: SortOrder
    imagePrompt?: SortOrderInput | SortOrder
    exampleSentence?: SortOrderInput | SortOrder
    mouth?: SortOrderInput | SortOrder
    _count?: StoryPanelCountOrderByAggregateInput
    _avg?: StoryPanelAvgOrderByAggregateInput
    _max?: StoryPanelMaxOrderByAggregateInput
    _min?: StoryPanelMinOrderByAggregateInput
    _sum?: StoryPanelSumOrderByAggregateInput
  }

  export type StoryPanelScalarWhereWithAggregatesInput = {
    AND?: StoryPanelScalarWhereWithAggregatesInput | StoryPanelScalarWhereWithAggregatesInput[]
    OR?: StoryPanelScalarWhereWithAggregatesInput[]
    NOT?: StoryPanelScalarWhereWithAggregatesInput | StoryPanelScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"StoryPanel"> | string
    storyId?: StringWithAggregatesFilter<"StoryPanel"> | string
    order?: IntWithAggregatesFilter<"StoryPanel"> | number
    imageUrl?: StringNullableWithAggregatesFilter<"StoryPanel"> | string | null
    sceneDescription?: StringWithAggregatesFilter<"StoryPanel"> | string
    imagePrompt?: StringNullableWithAggregatesFilter<"StoryPanel"> | string | null
    exampleSentence?: StringNullableWithAggregatesFilter<"StoryPanel"> | string | null
    mouth?: JsonNullableWithAggregatesFilter<"StoryPanel">
  }

  export type StorySubmissionWhereInput = {
    AND?: StorySubmissionWhereInput | StorySubmissionWhereInput[]
    OR?: StorySubmissionWhereInput[]
    NOT?: StorySubmissionWhereInput | StorySubmissionWhereInput[]
    id?: StringFilter<"StorySubmission"> | string
    storyId?: StringFilter<"StorySubmission"> | string
    studentName?: StringFilter<"StorySubmission"> | string
    status?: EnumStorySubmissionStatusFilter<"StorySubmission"> | $Enums.StorySubmissionStatus
    createdAt?: DateTimeFilter<"StorySubmission"> | Date | string
    recordings?: StoryRecordingListRelationFilter
    story?: XOR<StoryRelationFilter, StoryWhereInput>
  }

  export type StorySubmissionOrderByWithRelationInput = {
    id?: SortOrder
    storyId?: SortOrder
    studentName?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    recordings?: StoryRecordingOrderByRelationAggregateInput
    story?: StoryOrderByWithRelationInput
  }

  export type StorySubmissionWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: StorySubmissionWhereInput | StorySubmissionWhereInput[]
    OR?: StorySubmissionWhereInput[]
    NOT?: StorySubmissionWhereInput | StorySubmissionWhereInput[]
    storyId?: StringFilter<"StorySubmission"> | string
    studentName?: StringFilter<"StorySubmission"> | string
    status?: EnumStorySubmissionStatusFilter<"StorySubmission"> | $Enums.StorySubmissionStatus
    createdAt?: DateTimeFilter<"StorySubmission"> | Date | string
    recordings?: StoryRecordingListRelationFilter
    story?: XOR<StoryRelationFilter, StoryWhereInput>
  }, "id">

  export type StorySubmissionOrderByWithAggregationInput = {
    id?: SortOrder
    storyId?: SortOrder
    studentName?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    _count?: StorySubmissionCountOrderByAggregateInput
    _max?: StorySubmissionMaxOrderByAggregateInput
    _min?: StorySubmissionMinOrderByAggregateInput
  }

  export type StorySubmissionScalarWhereWithAggregatesInput = {
    AND?: StorySubmissionScalarWhereWithAggregatesInput | StorySubmissionScalarWhereWithAggregatesInput[]
    OR?: StorySubmissionScalarWhereWithAggregatesInput[]
    NOT?: StorySubmissionScalarWhereWithAggregatesInput | StorySubmissionScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"StorySubmission"> | string
    storyId?: StringWithAggregatesFilter<"StorySubmission"> | string
    studentName?: StringWithAggregatesFilter<"StorySubmission"> | string
    status?: EnumStorySubmissionStatusWithAggregatesFilter<"StorySubmission"> | $Enums.StorySubmissionStatus
    createdAt?: DateTimeWithAggregatesFilter<"StorySubmission"> | Date | string
  }

  export type StoryRecordingWhereInput = {
    AND?: StoryRecordingWhereInput | StoryRecordingWhereInput[]
    OR?: StoryRecordingWhereInput[]
    NOT?: StoryRecordingWhereInput | StoryRecordingWhereInput[]
    id?: StringFilter<"StoryRecording"> | string
    submissionId?: StringFilter<"StoryRecording"> | string
    panelOrder?: IntFilter<"StoryRecording"> | number
    audioUrl?: StringFilter<"StoryRecording"> | string
    mimeType?: StringFilter<"StoryRecording"> | string
    durationMs?: IntFilter<"StoryRecording"> | number
    envelope?: JsonNullableFilter<"StoryRecording">
    submission?: XOR<StorySubmissionRelationFilter, StorySubmissionWhereInput>
  }

  export type StoryRecordingOrderByWithRelationInput = {
    id?: SortOrder
    submissionId?: SortOrder
    panelOrder?: SortOrder
    audioUrl?: SortOrder
    mimeType?: SortOrder
    durationMs?: SortOrder
    envelope?: SortOrderInput | SortOrder
    submission?: StorySubmissionOrderByWithRelationInput
  }

  export type StoryRecordingWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    submissionId_panelOrder?: StoryRecordingSubmissionIdPanelOrderCompoundUniqueInput
    AND?: StoryRecordingWhereInput | StoryRecordingWhereInput[]
    OR?: StoryRecordingWhereInput[]
    NOT?: StoryRecordingWhereInput | StoryRecordingWhereInput[]
    submissionId?: StringFilter<"StoryRecording"> | string
    panelOrder?: IntFilter<"StoryRecording"> | number
    audioUrl?: StringFilter<"StoryRecording"> | string
    mimeType?: StringFilter<"StoryRecording"> | string
    durationMs?: IntFilter<"StoryRecording"> | number
    envelope?: JsonNullableFilter<"StoryRecording">
    submission?: XOR<StorySubmissionRelationFilter, StorySubmissionWhereInput>
  }, "id" | "submissionId_panelOrder">

  export type StoryRecordingOrderByWithAggregationInput = {
    id?: SortOrder
    submissionId?: SortOrder
    panelOrder?: SortOrder
    audioUrl?: SortOrder
    mimeType?: SortOrder
    durationMs?: SortOrder
    envelope?: SortOrderInput | SortOrder
    _count?: StoryRecordingCountOrderByAggregateInput
    _avg?: StoryRecordingAvgOrderByAggregateInput
    _max?: StoryRecordingMaxOrderByAggregateInput
    _min?: StoryRecordingMinOrderByAggregateInput
    _sum?: StoryRecordingSumOrderByAggregateInput
  }

  export type StoryRecordingScalarWhereWithAggregatesInput = {
    AND?: StoryRecordingScalarWhereWithAggregatesInput | StoryRecordingScalarWhereWithAggregatesInput[]
    OR?: StoryRecordingScalarWhereWithAggregatesInput[]
    NOT?: StoryRecordingScalarWhereWithAggregatesInput | StoryRecordingScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"StoryRecording"> | string
    submissionId?: StringWithAggregatesFilter<"StoryRecording"> | string
    panelOrder?: IntWithAggregatesFilter<"StoryRecording"> | number
    audioUrl?: StringWithAggregatesFilter<"StoryRecording"> | string
    mimeType?: StringWithAggregatesFilter<"StoryRecording"> | string
    durationMs?: IntWithAggregatesFilter<"StoryRecording"> | number
    envelope?: JsonNullableWithAggregatesFilter<"StoryRecording">
  }

  export type QuizCreateInput = {
    id?: string
    title: string
    description?: string | null
    imageUrl?: string | null
    quizType?: $Enums.QuestionType
    tags?: QuizCreatetagsInput | string[]
    statistics?: NullableJsonNullValueInput | InputJsonValue
    defaultSettings?: NullableJsonNullValueInput | InputJsonValue
    authorId?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    questions?: QuestionCreateNestedManyWithoutQuizInput
    likes?: QuizLikeCreateNestedManyWithoutQuizInput
    favorites?: QuizFavoriteCreateNestedManyWithoutQuizInput
  }

  export type QuizUncheckedCreateInput = {
    id?: string
    title: string
    description?: string | null
    imageUrl?: string | null
    quizType?: $Enums.QuestionType
    tags?: QuizCreatetagsInput | string[]
    statistics?: NullableJsonNullValueInput | InputJsonValue
    defaultSettings?: NullableJsonNullValueInput | InputJsonValue
    authorId?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    questions?: QuestionUncheckedCreateNestedManyWithoutQuizInput
    likes?: QuizLikeUncheckedCreateNestedManyWithoutQuizInput
    favorites?: QuizFavoriteUncheckedCreateNestedManyWithoutQuizInput
  }

  export type QuizUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    quizType?: EnumQuestionTypeFieldUpdateOperationsInput | $Enums.QuestionType
    tags?: QuizUpdatetagsInput | string[]
    statistics?: NullableJsonNullValueInput | InputJsonValue
    defaultSettings?: NullableJsonNullValueInput | InputJsonValue
    authorId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    questions?: QuestionUpdateManyWithoutQuizNestedInput
    likes?: QuizLikeUpdateManyWithoutQuizNestedInput
    favorites?: QuizFavoriteUpdateManyWithoutQuizNestedInput
  }

  export type QuizUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    quizType?: EnumQuestionTypeFieldUpdateOperationsInput | $Enums.QuestionType
    tags?: QuizUpdatetagsInput | string[]
    statistics?: NullableJsonNullValueInput | InputJsonValue
    defaultSettings?: NullableJsonNullValueInput | InputJsonValue
    authorId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    questions?: QuestionUncheckedUpdateManyWithoutQuizNestedInput
    likes?: QuizLikeUncheckedUpdateManyWithoutQuizNestedInput
    favorites?: QuizFavoriteUncheckedUpdateManyWithoutQuizNestedInput
  }

  export type QuizCreateManyInput = {
    id?: string
    title: string
    description?: string | null
    imageUrl?: string | null
    quizType?: $Enums.QuestionType
    tags?: QuizCreatetagsInput | string[]
    statistics?: NullableJsonNullValueInput | InputJsonValue
    defaultSettings?: NullableJsonNullValueInput | InputJsonValue
    authorId?: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type QuizUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    quizType?: EnumQuestionTypeFieldUpdateOperationsInput | $Enums.QuestionType
    tags?: QuizUpdatetagsInput | string[]
    statistics?: NullableJsonNullValueInput | InputJsonValue
    defaultSettings?: NullableJsonNullValueInput | InputJsonValue
    authorId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type QuizUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    quizType?: EnumQuestionTypeFieldUpdateOperationsInput | $Enums.QuestionType
    tags?: QuizUpdatetagsInput | string[]
    statistics?: NullableJsonNullValueInput | InputJsonValue
    defaultSettings?: NullableJsonNullValueInput | InputJsonValue
    authorId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type QuizLikeCreateInput = {
    id?: string
    userId: string
    createdAt?: Date | string
    quiz: QuizCreateNestedOneWithoutLikesInput
  }

  export type QuizLikeUncheckedCreateInput = {
    id?: string
    quizId: string
    userId: string
    createdAt?: Date | string
  }

  export type QuizLikeUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    quiz?: QuizUpdateOneRequiredWithoutLikesNestedInput
  }

  export type QuizLikeUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    quizId?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type QuizLikeCreateManyInput = {
    id?: string
    quizId: string
    userId: string
    createdAt?: Date | string
  }

  export type QuizLikeUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type QuizLikeUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    quizId?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type QuizFavoriteCreateInput = {
    id?: string
    userId: string
    createdAt?: Date | string
    quiz: QuizCreateNestedOneWithoutFavoritesInput
  }

  export type QuizFavoriteUncheckedCreateInput = {
    id?: string
    quizId: string
    userId: string
    createdAt?: Date | string
  }

  export type QuizFavoriteUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    quiz?: QuizUpdateOneRequiredWithoutFavoritesNestedInput
  }

  export type QuizFavoriteUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    quizId?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type QuizFavoriteCreateManyInput = {
    id?: string
    quizId: string
    userId: string
    createdAt?: Date | string
  }

  export type QuizFavoriteUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type QuizFavoriteUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    quizId?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type QuestionCreateInput = {
    id?: string
    question: string
    imageUrl?: string | null
    answers?: QuestionCreateanswersInput | string[]
    correctAnswer: string
    type?: $Enums.QuestionType
    quiz?: QuizCreateNestedOneWithoutQuestionsInput
  }

  export type QuestionUncheckedCreateInput = {
    id?: string
    question: string
    imageUrl?: string | null
    answers?: QuestionCreateanswersInput | string[]
    correctAnswer: string
    type?: $Enums.QuestionType
    quizId?: string | null
  }

  export type QuestionUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    question?: StringFieldUpdateOperationsInput | string
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    answers?: QuestionUpdateanswersInput | string[]
    correctAnswer?: StringFieldUpdateOperationsInput | string
    type?: EnumQuestionTypeFieldUpdateOperationsInput | $Enums.QuestionType
    quiz?: QuizUpdateOneWithoutQuestionsNestedInput
  }

  export type QuestionUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    question?: StringFieldUpdateOperationsInput | string
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    answers?: QuestionUpdateanswersInput | string[]
    correctAnswer?: StringFieldUpdateOperationsInput | string
    type?: EnumQuestionTypeFieldUpdateOperationsInput | $Enums.QuestionType
    quizId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type QuestionCreateManyInput = {
    id?: string
    question: string
    imageUrl?: string | null
    answers?: QuestionCreateanswersInput | string[]
    correctAnswer: string
    type?: $Enums.QuestionType
    quizId?: string | null
  }

  export type QuestionUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    question?: StringFieldUpdateOperationsInput | string
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    answers?: QuestionUpdateanswersInput | string[]
    correctAnswer?: StringFieldUpdateOperationsInput | string
    type?: EnumQuestionTypeFieldUpdateOperationsInput | $Enums.QuestionType
  }

  export type QuestionUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    question?: StringFieldUpdateOperationsInput | string
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    answers?: QuestionUpdateanswersInput | string[]
    correctAnswer?: StringFieldUpdateOperationsInput | string
    type?: EnumQuestionTypeFieldUpdateOperationsInput | $Enums.QuestionType
    quizId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type StoredImageCreateInput = {
    id?: string
    filename: string
    originalUrl: string
    blobUrl: string
    mimeType: string
    fileSize: number
    width: number
    height: number
    searchTerm?: string | null
    tags?: StoredImageCreatetagsInput | string[]
    pixabayId: number
    pixabayUser?: string | null
    usageCount?: number
    lastUsedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type StoredImageUncheckedCreateInput = {
    id?: string
    filename: string
    originalUrl: string
    blobUrl: string
    mimeType: string
    fileSize: number
    width: number
    height: number
    searchTerm?: string | null
    tags?: StoredImageCreatetagsInput | string[]
    pixabayId: number
    pixabayUser?: string | null
    usageCount?: number
    lastUsedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type StoredImageUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    filename?: StringFieldUpdateOperationsInput | string
    originalUrl?: StringFieldUpdateOperationsInput | string
    blobUrl?: StringFieldUpdateOperationsInput | string
    mimeType?: StringFieldUpdateOperationsInput | string
    fileSize?: IntFieldUpdateOperationsInput | number
    width?: IntFieldUpdateOperationsInput | number
    height?: IntFieldUpdateOperationsInput | number
    searchTerm?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: StoredImageUpdatetagsInput | string[]
    pixabayId?: IntFieldUpdateOperationsInput | number
    pixabayUser?: NullableStringFieldUpdateOperationsInput | string | null
    usageCount?: IntFieldUpdateOperationsInput | number
    lastUsedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StoredImageUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    filename?: StringFieldUpdateOperationsInput | string
    originalUrl?: StringFieldUpdateOperationsInput | string
    blobUrl?: StringFieldUpdateOperationsInput | string
    mimeType?: StringFieldUpdateOperationsInput | string
    fileSize?: IntFieldUpdateOperationsInput | number
    width?: IntFieldUpdateOperationsInput | number
    height?: IntFieldUpdateOperationsInput | number
    searchTerm?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: StoredImageUpdatetagsInput | string[]
    pixabayId?: IntFieldUpdateOperationsInput | number
    pixabayUser?: NullableStringFieldUpdateOperationsInput | string | null
    usageCount?: IntFieldUpdateOperationsInput | number
    lastUsedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StoredImageCreateManyInput = {
    id?: string
    filename: string
    originalUrl: string
    blobUrl: string
    mimeType: string
    fileSize: number
    width: number
    height: number
    searchTerm?: string | null
    tags?: StoredImageCreatetagsInput | string[]
    pixabayId: number
    pixabayUser?: string | null
    usageCount?: number
    lastUsedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type StoredImageUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    filename?: StringFieldUpdateOperationsInput | string
    originalUrl?: StringFieldUpdateOperationsInput | string
    blobUrl?: StringFieldUpdateOperationsInput | string
    mimeType?: StringFieldUpdateOperationsInput | string
    fileSize?: IntFieldUpdateOperationsInput | number
    width?: IntFieldUpdateOperationsInput | number
    height?: IntFieldUpdateOperationsInput | number
    searchTerm?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: StoredImageUpdatetagsInput | string[]
    pixabayId?: IntFieldUpdateOperationsInput | number
    pixabayUser?: NullableStringFieldUpdateOperationsInput | string | null
    usageCount?: IntFieldUpdateOperationsInput | number
    lastUsedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StoredImageUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    filename?: StringFieldUpdateOperationsInput | string
    originalUrl?: StringFieldUpdateOperationsInput | string
    blobUrl?: StringFieldUpdateOperationsInput | string
    mimeType?: StringFieldUpdateOperationsInput | string
    fileSize?: IntFieldUpdateOperationsInput | number
    width?: IntFieldUpdateOperationsInput | number
    height?: IntFieldUpdateOperationsInput | number
    searchTerm?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: StoredImageUpdatetagsInput | string[]
    pixabayId?: IntFieldUpdateOperationsInput | number
    pixabayUser?: NullableStringFieldUpdateOperationsInput | string | null
    usageCount?: IntFieldUpdateOperationsInput | number
    lastUsedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TagCreateInput = {
    id?: string
    name: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TagUncheckedCreateInput = {
    id?: string
    name: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TagUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TagUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TagCreateManyInput = {
    id?: string
    name: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TagUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TagUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StoryCreateInput = {
    id?: string
    authorId?: string
    title: string
    topicPrompt: string
    tags?: StoryCreatetagsInput | string[]
    storyType?: string | null
    characterSheet?: string | null
    artStyle?: string | null
    exampleStory?: string | null
    showExampleToStudents?: boolean
    status?: $Enums.StoryStatus
    shareToken: string
    createdAt?: Date | string
    updatedAt?: Date | string
    panels?: StoryPanelCreateNestedManyWithoutStoryInput
    submissions?: StorySubmissionCreateNestedManyWithoutStoryInput
  }

  export type StoryUncheckedCreateInput = {
    id?: string
    authorId?: string
    title: string
    topicPrompt: string
    tags?: StoryCreatetagsInput | string[]
    storyType?: string | null
    characterSheet?: string | null
    artStyle?: string | null
    exampleStory?: string | null
    showExampleToStudents?: boolean
    status?: $Enums.StoryStatus
    shareToken: string
    createdAt?: Date | string
    updatedAt?: Date | string
    panels?: StoryPanelUncheckedCreateNestedManyWithoutStoryInput
    submissions?: StorySubmissionUncheckedCreateNestedManyWithoutStoryInput
  }

  export type StoryUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    authorId?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    topicPrompt?: StringFieldUpdateOperationsInput | string
    tags?: StoryUpdatetagsInput | string[]
    storyType?: NullableStringFieldUpdateOperationsInput | string | null
    characterSheet?: NullableStringFieldUpdateOperationsInput | string | null
    artStyle?: NullableStringFieldUpdateOperationsInput | string | null
    exampleStory?: NullableStringFieldUpdateOperationsInput | string | null
    showExampleToStudents?: BoolFieldUpdateOperationsInput | boolean
    status?: EnumStoryStatusFieldUpdateOperationsInput | $Enums.StoryStatus
    shareToken?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    panels?: StoryPanelUpdateManyWithoutStoryNestedInput
    submissions?: StorySubmissionUpdateManyWithoutStoryNestedInput
  }

  export type StoryUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    authorId?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    topicPrompt?: StringFieldUpdateOperationsInput | string
    tags?: StoryUpdatetagsInput | string[]
    storyType?: NullableStringFieldUpdateOperationsInput | string | null
    characterSheet?: NullableStringFieldUpdateOperationsInput | string | null
    artStyle?: NullableStringFieldUpdateOperationsInput | string | null
    exampleStory?: NullableStringFieldUpdateOperationsInput | string | null
    showExampleToStudents?: BoolFieldUpdateOperationsInput | boolean
    status?: EnumStoryStatusFieldUpdateOperationsInput | $Enums.StoryStatus
    shareToken?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    panels?: StoryPanelUncheckedUpdateManyWithoutStoryNestedInput
    submissions?: StorySubmissionUncheckedUpdateManyWithoutStoryNestedInput
  }

  export type StoryCreateManyInput = {
    id?: string
    authorId?: string
    title: string
    topicPrompt: string
    tags?: StoryCreatetagsInput | string[]
    storyType?: string | null
    characterSheet?: string | null
    artStyle?: string | null
    exampleStory?: string | null
    showExampleToStudents?: boolean
    status?: $Enums.StoryStatus
    shareToken: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type StoryUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    authorId?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    topicPrompt?: StringFieldUpdateOperationsInput | string
    tags?: StoryUpdatetagsInput | string[]
    storyType?: NullableStringFieldUpdateOperationsInput | string | null
    characterSheet?: NullableStringFieldUpdateOperationsInput | string | null
    artStyle?: NullableStringFieldUpdateOperationsInput | string | null
    exampleStory?: NullableStringFieldUpdateOperationsInput | string | null
    showExampleToStudents?: BoolFieldUpdateOperationsInput | boolean
    status?: EnumStoryStatusFieldUpdateOperationsInput | $Enums.StoryStatus
    shareToken?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StoryUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    authorId?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    topicPrompt?: StringFieldUpdateOperationsInput | string
    tags?: StoryUpdatetagsInput | string[]
    storyType?: NullableStringFieldUpdateOperationsInput | string | null
    characterSheet?: NullableStringFieldUpdateOperationsInput | string | null
    artStyle?: NullableStringFieldUpdateOperationsInput | string | null
    exampleStory?: NullableStringFieldUpdateOperationsInput | string | null
    showExampleToStudents?: BoolFieldUpdateOperationsInput | boolean
    status?: EnumStoryStatusFieldUpdateOperationsInput | $Enums.StoryStatus
    shareToken?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StoryPanelCreateInput = {
    id?: string
    order: number
    imageUrl?: string | null
    sceneDescription: string
    imagePrompt?: string | null
    exampleSentence?: string | null
    mouth?: NullableJsonNullValueInput | InputJsonValue
    story: StoryCreateNestedOneWithoutPanelsInput
  }

  export type StoryPanelUncheckedCreateInput = {
    id?: string
    storyId: string
    order: number
    imageUrl?: string | null
    sceneDescription: string
    imagePrompt?: string | null
    exampleSentence?: string | null
    mouth?: NullableJsonNullValueInput | InputJsonValue
  }

  export type StoryPanelUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    order?: IntFieldUpdateOperationsInput | number
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    sceneDescription?: StringFieldUpdateOperationsInput | string
    imagePrompt?: NullableStringFieldUpdateOperationsInput | string | null
    exampleSentence?: NullableStringFieldUpdateOperationsInput | string | null
    mouth?: NullableJsonNullValueInput | InputJsonValue
    story?: StoryUpdateOneRequiredWithoutPanelsNestedInput
  }

  export type StoryPanelUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    storyId?: StringFieldUpdateOperationsInput | string
    order?: IntFieldUpdateOperationsInput | number
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    sceneDescription?: StringFieldUpdateOperationsInput | string
    imagePrompt?: NullableStringFieldUpdateOperationsInput | string | null
    exampleSentence?: NullableStringFieldUpdateOperationsInput | string | null
    mouth?: NullableJsonNullValueInput | InputJsonValue
  }

  export type StoryPanelCreateManyInput = {
    id?: string
    storyId: string
    order: number
    imageUrl?: string | null
    sceneDescription: string
    imagePrompt?: string | null
    exampleSentence?: string | null
    mouth?: NullableJsonNullValueInput | InputJsonValue
  }

  export type StoryPanelUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    order?: IntFieldUpdateOperationsInput | number
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    sceneDescription?: StringFieldUpdateOperationsInput | string
    imagePrompt?: NullableStringFieldUpdateOperationsInput | string | null
    exampleSentence?: NullableStringFieldUpdateOperationsInput | string | null
    mouth?: NullableJsonNullValueInput | InputJsonValue
  }

  export type StoryPanelUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    storyId?: StringFieldUpdateOperationsInput | string
    order?: IntFieldUpdateOperationsInput | number
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    sceneDescription?: StringFieldUpdateOperationsInput | string
    imagePrompt?: NullableStringFieldUpdateOperationsInput | string | null
    exampleSentence?: NullableStringFieldUpdateOperationsInput | string | null
    mouth?: NullableJsonNullValueInput | InputJsonValue
  }

  export type StorySubmissionCreateInput = {
    id?: string
    studentName: string
    status?: $Enums.StorySubmissionStatus
    createdAt?: Date | string
    recordings?: StoryRecordingCreateNestedManyWithoutSubmissionInput
    story: StoryCreateNestedOneWithoutSubmissionsInput
  }

  export type StorySubmissionUncheckedCreateInput = {
    id?: string
    storyId: string
    studentName: string
    status?: $Enums.StorySubmissionStatus
    createdAt?: Date | string
    recordings?: StoryRecordingUncheckedCreateNestedManyWithoutSubmissionInput
  }

  export type StorySubmissionUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    studentName?: StringFieldUpdateOperationsInput | string
    status?: EnumStorySubmissionStatusFieldUpdateOperationsInput | $Enums.StorySubmissionStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    recordings?: StoryRecordingUpdateManyWithoutSubmissionNestedInput
    story?: StoryUpdateOneRequiredWithoutSubmissionsNestedInput
  }

  export type StorySubmissionUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    storyId?: StringFieldUpdateOperationsInput | string
    studentName?: StringFieldUpdateOperationsInput | string
    status?: EnumStorySubmissionStatusFieldUpdateOperationsInput | $Enums.StorySubmissionStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    recordings?: StoryRecordingUncheckedUpdateManyWithoutSubmissionNestedInput
  }

  export type StorySubmissionCreateManyInput = {
    id?: string
    storyId: string
    studentName: string
    status?: $Enums.StorySubmissionStatus
    createdAt?: Date | string
  }

  export type StorySubmissionUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    studentName?: StringFieldUpdateOperationsInput | string
    status?: EnumStorySubmissionStatusFieldUpdateOperationsInput | $Enums.StorySubmissionStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StorySubmissionUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    storyId?: StringFieldUpdateOperationsInput | string
    studentName?: StringFieldUpdateOperationsInput | string
    status?: EnumStorySubmissionStatusFieldUpdateOperationsInput | $Enums.StorySubmissionStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StoryRecordingCreateInput = {
    id?: string
    panelOrder: number
    audioUrl: string
    mimeType: string
    durationMs: number
    envelope?: NullableJsonNullValueInput | InputJsonValue
    submission: StorySubmissionCreateNestedOneWithoutRecordingsInput
  }

  export type StoryRecordingUncheckedCreateInput = {
    id?: string
    submissionId: string
    panelOrder: number
    audioUrl: string
    mimeType: string
    durationMs: number
    envelope?: NullableJsonNullValueInput | InputJsonValue
  }

  export type StoryRecordingUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    panelOrder?: IntFieldUpdateOperationsInput | number
    audioUrl?: StringFieldUpdateOperationsInput | string
    mimeType?: StringFieldUpdateOperationsInput | string
    durationMs?: IntFieldUpdateOperationsInput | number
    envelope?: NullableJsonNullValueInput | InputJsonValue
    submission?: StorySubmissionUpdateOneRequiredWithoutRecordingsNestedInput
  }

  export type StoryRecordingUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    submissionId?: StringFieldUpdateOperationsInput | string
    panelOrder?: IntFieldUpdateOperationsInput | number
    audioUrl?: StringFieldUpdateOperationsInput | string
    mimeType?: StringFieldUpdateOperationsInput | string
    durationMs?: IntFieldUpdateOperationsInput | number
    envelope?: NullableJsonNullValueInput | InputJsonValue
  }

  export type StoryRecordingCreateManyInput = {
    id?: string
    submissionId: string
    panelOrder: number
    audioUrl: string
    mimeType: string
    durationMs: number
    envelope?: NullableJsonNullValueInput | InputJsonValue
  }

  export type StoryRecordingUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    panelOrder?: IntFieldUpdateOperationsInput | number
    audioUrl?: StringFieldUpdateOperationsInput | string
    mimeType?: StringFieldUpdateOperationsInput | string
    durationMs?: IntFieldUpdateOperationsInput | number
    envelope?: NullableJsonNullValueInput | InputJsonValue
  }

  export type StoryRecordingUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    submissionId?: StringFieldUpdateOperationsInput | string
    panelOrder?: IntFieldUpdateOperationsInput | number
    audioUrl?: StringFieldUpdateOperationsInput | string
    mimeType?: StringFieldUpdateOperationsInput | string
    durationMs?: IntFieldUpdateOperationsInput | number
    envelope?: NullableJsonNullValueInput | InputJsonValue
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type EnumQuestionTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.QuestionType | EnumQuestionTypeFieldRefInput<$PrismaModel>
    in?: $Enums.QuestionType[] | ListEnumQuestionTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.QuestionType[] | ListEnumQuestionTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumQuestionTypeFilter<$PrismaModel> | $Enums.QuestionType
  }

  export type StringNullableListFilter<$PrismaModel = never> = {
    equals?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    has?: string | StringFieldRefInput<$PrismaModel> | null
    hasEvery?: string[] | ListStringFieldRefInput<$PrismaModel>
    hasSome?: string[] | ListStringFieldRefInput<$PrismaModel>
    isEmpty?: boolean
  }
  export type JsonNullableFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<JsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type QuestionListRelationFilter = {
    every?: QuestionWhereInput
    some?: QuestionWhereInput
    none?: QuestionWhereInput
  }

  export type QuizLikeListRelationFilter = {
    every?: QuizLikeWhereInput
    some?: QuizLikeWhereInput
    none?: QuizLikeWhereInput
  }

  export type QuizFavoriteListRelationFilter = {
    every?: QuizFavoriteWhereInput
    some?: QuizFavoriteWhereInput
    none?: QuizFavoriteWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type QuestionOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type QuizLikeOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type QuizFavoriteOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type QuizCountOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    description?: SortOrder
    imageUrl?: SortOrder
    quizType?: SortOrder
    tags?: SortOrder
    statistics?: SortOrder
    defaultSettings?: SortOrder
    authorId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type QuizMaxOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    description?: SortOrder
    imageUrl?: SortOrder
    quizType?: SortOrder
    authorId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type QuizMinOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    description?: SortOrder
    imageUrl?: SortOrder
    quizType?: SortOrder
    authorId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type EnumQuestionTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.QuestionType | EnumQuestionTypeFieldRefInput<$PrismaModel>
    in?: $Enums.QuestionType[] | ListEnumQuestionTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.QuestionType[] | ListEnumQuestionTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumQuestionTypeWithAggregatesFilter<$PrismaModel> | $Enums.QuestionType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumQuestionTypeFilter<$PrismaModel>
    _max?: NestedEnumQuestionTypeFilter<$PrismaModel>
  }
  export type JsonNullableWithAggregatesFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedJsonNullableFilter<$PrismaModel>
    _max?: NestedJsonNullableFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type QuizRelationFilter = {
    is?: QuizWhereInput
    isNot?: QuizWhereInput
  }

  export type QuizLikeQuizIdUserIdCompoundUniqueInput = {
    quizId: string
    userId: string
  }

  export type QuizLikeCountOrderByAggregateInput = {
    id?: SortOrder
    quizId?: SortOrder
    userId?: SortOrder
    createdAt?: SortOrder
  }

  export type QuizLikeMaxOrderByAggregateInput = {
    id?: SortOrder
    quizId?: SortOrder
    userId?: SortOrder
    createdAt?: SortOrder
  }

  export type QuizLikeMinOrderByAggregateInput = {
    id?: SortOrder
    quizId?: SortOrder
    userId?: SortOrder
    createdAt?: SortOrder
  }

  export type QuizFavoriteQuizIdUserIdCompoundUniqueInput = {
    quizId: string
    userId: string
  }

  export type QuizFavoriteCountOrderByAggregateInput = {
    id?: SortOrder
    quizId?: SortOrder
    userId?: SortOrder
    createdAt?: SortOrder
  }

  export type QuizFavoriteMaxOrderByAggregateInput = {
    id?: SortOrder
    quizId?: SortOrder
    userId?: SortOrder
    createdAt?: SortOrder
  }

  export type QuizFavoriteMinOrderByAggregateInput = {
    id?: SortOrder
    quizId?: SortOrder
    userId?: SortOrder
    createdAt?: SortOrder
  }

  export type QuizNullableRelationFilter = {
    is?: QuizWhereInput | null
    isNot?: QuizWhereInput | null
  }

  export type QuestionCountOrderByAggregateInput = {
    id?: SortOrder
    question?: SortOrder
    imageUrl?: SortOrder
    answers?: SortOrder
    correctAnswer?: SortOrder
    type?: SortOrder
    quizId?: SortOrder
  }

  export type QuestionMaxOrderByAggregateInput = {
    id?: SortOrder
    question?: SortOrder
    imageUrl?: SortOrder
    correctAnswer?: SortOrder
    type?: SortOrder
    quizId?: SortOrder
  }

  export type QuestionMinOrderByAggregateInput = {
    id?: SortOrder
    question?: SortOrder
    imageUrl?: SortOrder
    correctAnswer?: SortOrder
    type?: SortOrder
    quizId?: SortOrder
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type StoredImageCountOrderByAggregateInput = {
    id?: SortOrder
    filename?: SortOrder
    originalUrl?: SortOrder
    blobUrl?: SortOrder
    mimeType?: SortOrder
    fileSize?: SortOrder
    width?: SortOrder
    height?: SortOrder
    searchTerm?: SortOrder
    tags?: SortOrder
    pixabayId?: SortOrder
    pixabayUser?: SortOrder
    usageCount?: SortOrder
    lastUsedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type StoredImageAvgOrderByAggregateInput = {
    fileSize?: SortOrder
    width?: SortOrder
    height?: SortOrder
    pixabayId?: SortOrder
    usageCount?: SortOrder
  }

  export type StoredImageMaxOrderByAggregateInput = {
    id?: SortOrder
    filename?: SortOrder
    originalUrl?: SortOrder
    blobUrl?: SortOrder
    mimeType?: SortOrder
    fileSize?: SortOrder
    width?: SortOrder
    height?: SortOrder
    searchTerm?: SortOrder
    pixabayId?: SortOrder
    pixabayUser?: SortOrder
    usageCount?: SortOrder
    lastUsedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type StoredImageMinOrderByAggregateInput = {
    id?: SortOrder
    filename?: SortOrder
    originalUrl?: SortOrder
    blobUrl?: SortOrder
    mimeType?: SortOrder
    fileSize?: SortOrder
    width?: SortOrder
    height?: SortOrder
    searchTerm?: SortOrder
    pixabayId?: SortOrder
    pixabayUser?: SortOrder
    usageCount?: SortOrder
    lastUsedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type StoredImageSumOrderByAggregateInput = {
    fileSize?: SortOrder
    width?: SortOrder
    height?: SortOrder
    pixabayId?: SortOrder
    usageCount?: SortOrder
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type TagCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TagMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TagMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type EnumStoryStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.StoryStatus | EnumStoryStatusFieldRefInput<$PrismaModel>
    in?: $Enums.StoryStatus[] | ListEnumStoryStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.StoryStatus[] | ListEnumStoryStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumStoryStatusFilter<$PrismaModel> | $Enums.StoryStatus
  }

  export type StoryPanelListRelationFilter = {
    every?: StoryPanelWhereInput
    some?: StoryPanelWhereInput
    none?: StoryPanelWhereInput
  }

  export type StorySubmissionListRelationFilter = {
    every?: StorySubmissionWhereInput
    some?: StorySubmissionWhereInput
    none?: StorySubmissionWhereInput
  }

  export type StoryPanelOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type StorySubmissionOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type StoryCountOrderByAggregateInput = {
    id?: SortOrder
    authorId?: SortOrder
    title?: SortOrder
    topicPrompt?: SortOrder
    tags?: SortOrder
    storyType?: SortOrder
    characterSheet?: SortOrder
    artStyle?: SortOrder
    exampleStory?: SortOrder
    showExampleToStudents?: SortOrder
    status?: SortOrder
    shareToken?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type StoryMaxOrderByAggregateInput = {
    id?: SortOrder
    authorId?: SortOrder
    title?: SortOrder
    topicPrompt?: SortOrder
    storyType?: SortOrder
    characterSheet?: SortOrder
    artStyle?: SortOrder
    exampleStory?: SortOrder
    showExampleToStudents?: SortOrder
    status?: SortOrder
    shareToken?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type StoryMinOrderByAggregateInput = {
    id?: SortOrder
    authorId?: SortOrder
    title?: SortOrder
    topicPrompt?: SortOrder
    storyType?: SortOrder
    characterSheet?: SortOrder
    artStyle?: SortOrder
    exampleStory?: SortOrder
    showExampleToStudents?: SortOrder
    status?: SortOrder
    shareToken?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type EnumStoryStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.StoryStatus | EnumStoryStatusFieldRefInput<$PrismaModel>
    in?: $Enums.StoryStatus[] | ListEnumStoryStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.StoryStatus[] | ListEnumStoryStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumStoryStatusWithAggregatesFilter<$PrismaModel> | $Enums.StoryStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumStoryStatusFilter<$PrismaModel>
    _max?: NestedEnumStoryStatusFilter<$PrismaModel>
  }

  export type StoryRelationFilter = {
    is?: StoryWhereInput
    isNot?: StoryWhereInput
  }

  export type StoryPanelStoryIdOrderCompoundUniqueInput = {
    storyId: string
    order: number
  }

  export type StoryPanelCountOrderByAggregateInput = {
    id?: SortOrder
    storyId?: SortOrder
    order?: SortOrder
    imageUrl?: SortOrder
    sceneDescription?: SortOrder
    imagePrompt?: SortOrder
    exampleSentence?: SortOrder
    mouth?: SortOrder
  }

  export type StoryPanelAvgOrderByAggregateInput = {
    order?: SortOrder
  }

  export type StoryPanelMaxOrderByAggregateInput = {
    id?: SortOrder
    storyId?: SortOrder
    order?: SortOrder
    imageUrl?: SortOrder
    sceneDescription?: SortOrder
    imagePrompt?: SortOrder
    exampleSentence?: SortOrder
  }

  export type StoryPanelMinOrderByAggregateInput = {
    id?: SortOrder
    storyId?: SortOrder
    order?: SortOrder
    imageUrl?: SortOrder
    sceneDescription?: SortOrder
    imagePrompt?: SortOrder
    exampleSentence?: SortOrder
  }

  export type StoryPanelSumOrderByAggregateInput = {
    order?: SortOrder
  }

  export type EnumStorySubmissionStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.StorySubmissionStatus | EnumStorySubmissionStatusFieldRefInput<$PrismaModel>
    in?: $Enums.StorySubmissionStatus[] | ListEnumStorySubmissionStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.StorySubmissionStatus[] | ListEnumStorySubmissionStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumStorySubmissionStatusFilter<$PrismaModel> | $Enums.StorySubmissionStatus
  }

  export type StoryRecordingListRelationFilter = {
    every?: StoryRecordingWhereInput
    some?: StoryRecordingWhereInput
    none?: StoryRecordingWhereInput
  }

  export type StoryRecordingOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type StorySubmissionCountOrderByAggregateInput = {
    id?: SortOrder
    storyId?: SortOrder
    studentName?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
  }

  export type StorySubmissionMaxOrderByAggregateInput = {
    id?: SortOrder
    storyId?: SortOrder
    studentName?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
  }

  export type StorySubmissionMinOrderByAggregateInput = {
    id?: SortOrder
    storyId?: SortOrder
    studentName?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
  }

  export type EnumStorySubmissionStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.StorySubmissionStatus | EnumStorySubmissionStatusFieldRefInput<$PrismaModel>
    in?: $Enums.StorySubmissionStatus[] | ListEnumStorySubmissionStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.StorySubmissionStatus[] | ListEnumStorySubmissionStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumStorySubmissionStatusWithAggregatesFilter<$PrismaModel> | $Enums.StorySubmissionStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumStorySubmissionStatusFilter<$PrismaModel>
    _max?: NestedEnumStorySubmissionStatusFilter<$PrismaModel>
  }

  export type StorySubmissionRelationFilter = {
    is?: StorySubmissionWhereInput
    isNot?: StorySubmissionWhereInput
  }

  export type StoryRecordingSubmissionIdPanelOrderCompoundUniqueInput = {
    submissionId: string
    panelOrder: number
  }

  export type StoryRecordingCountOrderByAggregateInput = {
    id?: SortOrder
    submissionId?: SortOrder
    panelOrder?: SortOrder
    audioUrl?: SortOrder
    mimeType?: SortOrder
    durationMs?: SortOrder
    envelope?: SortOrder
  }

  export type StoryRecordingAvgOrderByAggregateInput = {
    panelOrder?: SortOrder
    durationMs?: SortOrder
  }

  export type StoryRecordingMaxOrderByAggregateInput = {
    id?: SortOrder
    submissionId?: SortOrder
    panelOrder?: SortOrder
    audioUrl?: SortOrder
    mimeType?: SortOrder
    durationMs?: SortOrder
  }

  export type StoryRecordingMinOrderByAggregateInput = {
    id?: SortOrder
    submissionId?: SortOrder
    panelOrder?: SortOrder
    audioUrl?: SortOrder
    mimeType?: SortOrder
    durationMs?: SortOrder
  }

  export type StoryRecordingSumOrderByAggregateInput = {
    panelOrder?: SortOrder
    durationMs?: SortOrder
  }

  export type QuizCreatetagsInput = {
    set: string[]
  }

  export type QuestionCreateNestedManyWithoutQuizInput = {
    create?: XOR<QuestionCreateWithoutQuizInput, QuestionUncheckedCreateWithoutQuizInput> | QuestionCreateWithoutQuizInput[] | QuestionUncheckedCreateWithoutQuizInput[]
    connectOrCreate?: QuestionCreateOrConnectWithoutQuizInput | QuestionCreateOrConnectWithoutQuizInput[]
    createMany?: QuestionCreateManyQuizInputEnvelope
    connect?: QuestionWhereUniqueInput | QuestionWhereUniqueInput[]
  }

  export type QuizLikeCreateNestedManyWithoutQuizInput = {
    create?: XOR<QuizLikeCreateWithoutQuizInput, QuizLikeUncheckedCreateWithoutQuizInput> | QuizLikeCreateWithoutQuizInput[] | QuizLikeUncheckedCreateWithoutQuizInput[]
    connectOrCreate?: QuizLikeCreateOrConnectWithoutQuizInput | QuizLikeCreateOrConnectWithoutQuizInput[]
    createMany?: QuizLikeCreateManyQuizInputEnvelope
    connect?: QuizLikeWhereUniqueInput | QuizLikeWhereUniqueInput[]
  }

  export type QuizFavoriteCreateNestedManyWithoutQuizInput = {
    create?: XOR<QuizFavoriteCreateWithoutQuizInput, QuizFavoriteUncheckedCreateWithoutQuizInput> | QuizFavoriteCreateWithoutQuizInput[] | QuizFavoriteUncheckedCreateWithoutQuizInput[]
    connectOrCreate?: QuizFavoriteCreateOrConnectWithoutQuizInput | QuizFavoriteCreateOrConnectWithoutQuizInput[]
    createMany?: QuizFavoriteCreateManyQuizInputEnvelope
    connect?: QuizFavoriteWhereUniqueInput | QuizFavoriteWhereUniqueInput[]
  }

  export type QuestionUncheckedCreateNestedManyWithoutQuizInput = {
    create?: XOR<QuestionCreateWithoutQuizInput, QuestionUncheckedCreateWithoutQuizInput> | QuestionCreateWithoutQuizInput[] | QuestionUncheckedCreateWithoutQuizInput[]
    connectOrCreate?: QuestionCreateOrConnectWithoutQuizInput | QuestionCreateOrConnectWithoutQuizInput[]
    createMany?: QuestionCreateManyQuizInputEnvelope
    connect?: QuestionWhereUniqueInput | QuestionWhereUniqueInput[]
  }

  export type QuizLikeUncheckedCreateNestedManyWithoutQuizInput = {
    create?: XOR<QuizLikeCreateWithoutQuizInput, QuizLikeUncheckedCreateWithoutQuizInput> | QuizLikeCreateWithoutQuizInput[] | QuizLikeUncheckedCreateWithoutQuizInput[]
    connectOrCreate?: QuizLikeCreateOrConnectWithoutQuizInput | QuizLikeCreateOrConnectWithoutQuizInput[]
    createMany?: QuizLikeCreateManyQuizInputEnvelope
    connect?: QuizLikeWhereUniqueInput | QuizLikeWhereUniqueInput[]
  }

  export type QuizFavoriteUncheckedCreateNestedManyWithoutQuizInput = {
    create?: XOR<QuizFavoriteCreateWithoutQuizInput, QuizFavoriteUncheckedCreateWithoutQuizInput> | QuizFavoriteCreateWithoutQuizInput[] | QuizFavoriteUncheckedCreateWithoutQuizInput[]
    connectOrCreate?: QuizFavoriteCreateOrConnectWithoutQuizInput | QuizFavoriteCreateOrConnectWithoutQuizInput[]
    createMany?: QuizFavoriteCreateManyQuizInputEnvelope
    connect?: QuizFavoriteWhereUniqueInput | QuizFavoriteWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type EnumQuestionTypeFieldUpdateOperationsInput = {
    set?: $Enums.QuestionType
  }

  export type QuizUpdatetagsInput = {
    set?: string[]
    push?: string | string[]
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type QuestionUpdateManyWithoutQuizNestedInput = {
    create?: XOR<QuestionCreateWithoutQuizInput, QuestionUncheckedCreateWithoutQuizInput> | QuestionCreateWithoutQuizInput[] | QuestionUncheckedCreateWithoutQuizInput[]
    connectOrCreate?: QuestionCreateOrConnectWithoutQuizInput | QuestionCreateOrConnectWithoutQuizInput[]
    upsert?: QuestionUpsertWithWhereUniqueWithoutQuizInput | QuestionUpsertWithWhereUniqueWithoutQuizInput[]
    createMany?: QuestionCreateManyQuizInputEnvelope
    set?: QuestionWhereUniqueInput | QuestionWhereUniqueInput[]
    disconnect?: QuestionWhereUniqueInput | QuestionWhereUniqueInput[]
    delete?: QuestionWhereUniqueInput | QuestionWhereUniqueInput[]
    connect?: QuestionWhereUniqueInput | QuestionWhereUniqueInput[]
    update?: QuestionUpdateWithWhereUniqueWithoutQuizInput | QuestionUpdateWithWhereUniqueWithoutQuizInput[]
    updateMany?: QuestionUpdateManyWithWhereWithoutQuizInput | QuestionUpdateManyWithWhereWithoutQuizInput[]
    deleteMany?: QuestionScalarWhereInput | QuestionScalarWhereInput[]
  }

  export type QuizLikeUpdateManyWithoutQuizNestedInput = {
    create?: XOR<QuizLikeCreateWithoutQuizInput, QuizLikeUncheckedCreateWithoutQuizInput> | QuizLikeCreateWithoutQuizInput[] | QuizLikeUncheckedCreateWithoutQuizInput[]
    connectOrCreate?: QuizLikeCreateOrConnectWithoutQuizInput | QuizLikeCreateOrConnectWithoutQuizInput[]
    upsert?: QuizLikeUpsertWithWhereUniqueWithoutQuizInput | QuizLikeUpsertWithWhereUniqueWithoutQuizInput[]
    createMany?: QuizLikeCreateManyQuizInputEnvelope
    set?: QuizLikeWhereUniqueInput | QuizLikeWhereUniqueInput[]
    disconnect?: QuizLikeWhereUniqueInput | QuizLikeWhereUniqueInput[]
    delete?: QuizLikeWhereUniqueInput | QuizLikeWhereUniqueInput[]
    connect?: QuizLikeWhereUniqueInput | QuizLikeWhereUniqueInput[]
    update?: QuizLikeUpdateWithWhereUniqueWithoutQuizInput | QuizLikeUpdateWithWhereUniqueWithoutQuizInput[]
    updateMany?: QuizLikeUpdateManyWithWhereWithoutQuizInput | QuizLikeUpdateManyWithWhereWithoutQuizInput[]
    deleteMany?: QuizLikeScalarWhereInput | QuizLikeScalarWhereInput[]
  }

  export type QuizFavoriteUpdateManyWithoutQuizNestedInput = {
    create?: XOR<QuizFavoriteCreateWithoutQuizInput, QuizFavoriteUncheckedCreateWithoutQuizInput> | QuizFavoriteCreateWithoutQuizInput[] | QuizFavoriteUncheckedCreateWithoutQuizInput[]
    connectOrCreate?: QuizFavoriteCreateOrConnectWithoutQuizInput | QuizFavoriteCreateOrConnectWithoutQuizInput[]
    upsert?: QuizFavoriteUpsertWithWhereUniqueWithoutQuizInput | QuizFavoriteUpsertWithWhereUniqueWithoutQuizInput[]
    createMany?: QuizFavoriteCreateManyQuizInputEnvelope
    set?: QuizFavoriteWhereUniqueInput | QuizFavoriteWhereUniqueInput[]
    disconnect?: QuizFavoriteWhereUniqueInput | QuizFavoriteWhereUniqueInput[]
    delete?: QuizFavoriteWhereUniqueInput | QuizFavoriteWhereUniqueInput[]
    connect?: QuizFavoriteWhereUniqueInput | QuizFavoriteWhereUniqueInput[]
    update?: QuizFavoriteUpdateWithWhereUniqueWithoutQuizInput | QuizFavoriteUpdateWithWhereUniqueWithoutQuizInput[]
    updateMany?: QuizFavoriteUpdateManyWithWhereWithoutQuizInput | QuizFavoriteUpdateManyWithWhereWithoutQuizInput[]
    deleteMany?: QuizFavoriteScalarWhereInput | QuizFavoriteScalarWhereInput[]
  }

  export type QuestionUncheckedUpdateManyWithoutQuizNestedInput = {
    create?: XOR<QuestionCreateWithoutQuizInput, QuestionUncheckedCreateWithoutQuizInput> | QuestionCreateWithoutQuizInput[] | QuestionUncheckedCreateWithoutQuizInput[]
    connectOrCreate?: QuestionCreateOrConnectWithoutQuizInput | QuestionCreateOrConnectWithoutQuizInput[]
    upsert?: QuestionUpsertWithWhereUniqueWithoutQuizInput | QuestionUpsertWithWhereUniqueWithoutQuizInput[]
    createMany?: QuestionCreateManyQuizInputEnvelope
    set?: QuestionWhereUniqueInput | QuestionWhereUniqueInput[]
    disconnect?: QuestionWhereUniqueInput | QuestionWhereUniqueInput[]
    delete?: QuestionWhereUniqueInput | QuestionWhereUniqueInput[]
    connect?: QuestionWhereUniqueInput | QuestionWhereUniqueInput[]
    update?: QuestionUpdateWithWhereUniqueWithoutQuizInput | QuestionUpdateWithWhereUniqueWithoutQuizInput[]
    updateMany?: QuestionUpdateManyWithWhereWithoutQuizInput | QuestionUpdateManyWithWhereWithoutQuizInput[]
    deleteMany?: QuestionScalarWhereInput | QuestionScalarWhereInput[]
  }

  export type QuizLikeUncheckedUpdateManyWithoutQuizNestedInput = {
    create?: XOR<QuizLikeCreateWithoutQuizInput, QuizLikeUncheckedCreateWithoutQuizInput> | QuizLikeCreateWithoutQuizInput[] | QuizLikeUncheckedCreateWithoutQuizInput[]
    connectOrCreate?: QuizLikeCreateOrConnectWithoutQuizInput | QuizLikeCreateOrConnectWithoutQuizInput[]
    upsert?: QuizLikeUpsertWithWhereUniqueWithoutQuizInput | QuizLikeUpsertWithWhereUniqueWithoutQuizInput[]
    createMany?: QuizLikeCreateManyQuizInputEnvelope
    set?: QuizLikeWhereUniqueInput | QuizLikeWhereUniqueInput[]
    disconnect?: QuizLikeWhereUniqueInput | QuizLikeWhereUniqueInput[]
    delete?: QuizLikeWhereUniqueInput | QuizLikeWhereUniqueInput[]
    connect?: QuizLikeWhereUniqueInput | QuizLikeWhereUniqueInput[]
    update?: QuizLikeUpdateWithWhereUniqueWithoutQuizInput | QuizLikeUpdateWithWhereUniqueWithoutQuizInput[]
    updateMany?: QuizLikeUpdateManyWithWhereWithoutQuizInput | QuizLikeUpdateManyWithWhereWithoutQuizInput[]
    deleteMany?: QuizLikeScalarWhereInput | QuizLikeScalarWhereInput[]
  }

  export type QuizFavoriteUncheckedUpdateManyWithoutQuizNestedInput = {
    create?: XOR<QuizFavoriteCreateWithoutQuizInput, QuizFavoriteUncheckedCreateWithoutQuizInput> | QuizFavoriteCreateWithoutQuizInput[] | QuizFavoriteUncheckedCreateWithoutQuizInput[]
    connectOrCreate?: QuizFavoriteCreateOrConnectWithoutQuizInput | QuizFavoriteCreateOrConnectWithoutQuizInput[]
    upsert?: QuizFavoriteUpsertWithWhereUniqueWithoutQuizInput | QuizFavoriteUpsertWithWhereUniqueWithoutQuizInput[]
    createMany?: QuizFavoriteCreateManyQuizInputEnvelope
    set?: QuizFavoriteWhereUniqueInput | QuizFavoriteWhereUniqueInput[]
    disconnect?: QuizFavoriteWhereUniqueInput | QuizFavoriteWhereUniqueInput[]
    delete?: QuizFavoriteWhereUniqueInput | QuizFavoriteWhereUniqueInput[]
    connect?: QuizFavoriteWhereUniqueInput | QuizFavoriteWhereUniqueInput[]
    update?: QuizFavoriteUpdateWithWhereUniqueWithoutQuizInput | QuizFavoriteUpdateWithWhereUniqueWithoutQuizInput[]
    updateMany?: QuizFavoriteUpdateManyWithWhereWithoutQuizInput | QuizFavoriteUpdateManyWithWhereWithoutQuizInput[]
    deleteMany?: QuizFavoriteScalarWhereInput | QuizFavoriteScalarWhereInput[]
  }

  export type QuizCreateNestedOneWithoutLikesInput = {
    create?: XOR<QuizCreateWithoutLikesInput, QuizUncheckedCreateWithoutLikesInput>
    connectOrCreate?: QuizCreateOrConnectWithoutLikesInput
    connect?: QuizWhereUniqueInput
  }

  export type QuizUpdateOneRequiredWithoutLikesNestedInput = {
    create?: XOR<QuizCreateWithoutLikesInput, QuizUncheckedCreateWithoutLikesInput>
    connectOrCreate?: QuizCreateOrConnectWithoutLikesInput
    upsert?: QuizUpsertWithoutLikesInput
    connect?: QuizWhereUniqueInput
    update?: XOR<XOR<QuizUpdateToOneWithWhereWithoutLikesInput, QuizUpdateWithoutLikesInput>, QuizUncheckedUpdateWithoutLikesInput>
  }

  export type QuizCreateNestedOneWithoutFavoritesInput = {
    create?: XOR<QuizCreateWithoutFavoritesInput, QuizUncheckedCreateWithoutFavoritesInput>
    connectOrCreate?: QuizCreateOrConnectWithoutFavoritesInput
    connect?: QuizWhereUniqueInput
  }

  export type QuizUpdateOneRequiredWithoutFavoritesNestedInput = {
    create?: XOR<QuizCreateWithoutFavoritesInput, QuizUncheckedCreateWithoutFavoritesInput>
    connectOrCreate?: QuizCreateOrConnectWithoutFavoritesInput
    upsert?: QuizUpsertWithoutFavoritesInput
    connect?: QuizWhereUniqueInput
    update?: XOR<XOR<QuizUpdateToOneWithWhereWithoutFavoritesInput, QuizUpdateWithoutFavoritesInput>, QuizUncheckedUpdateWithoutFavoritesInput>
  }

  export type QuestionCreateanswersInput = {
    set: string[]
  }

  export type QuizCreateNestedOneWithoutQuestionsInput = {
    create?: XOR<QuizCreateWithoutQuestionsInput, QuizUncheckedCreateWithoutQuestionsInput>
    connectOrCreate?: QuizCreateOrConnectWithoutQuestionsInput
    connect?: QuizWhereUniqueInput
  }

  export type QuestionUpdateanswersInput = {
    set?: string[]
    push?: string | string[]
  }

  export type QuizUpdateOneWithoutQuestionsNestedInput = {
    create?: XOR<QuizCreateWithoutQuestionsInput, QuizUncheckedCreateWithoutQuestionsInput>
    connectOrCreate?: QuizCreateOrConnectWithoutQuestionsInput
    upsert?: QuizUpsertWithoutQuestionsInput
    disconnect?: QuizWhereInput | boolean
    delete?: QuizWhereInput | boolean
    connect?: QuizWhereUniqueInput
    update?: XOR<XOR<QuizUpdateToOneWithWhereWithoutQuestionsInput, QuizUpdateWithoutQuestionsInput>, QuizUncheckedUpdateWithoutQuestionsInput>
  }

  export type StoredImageCreatetagsInput = {
    set: string[]
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type StoredImageUpdatetagsInput = {
    set?: string[]
    push?: string | string[]
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type StoryCreatetagsInput = {
    set: string[]
  }

  export type StoryPanelCreateNestedManyWithoutStoryInput = {
    create?: XOR<StoryPanelCreateWithoutStoryInput, StoryPanelUncheckedCreateWithoutStoryInput> | StoryPanelCreateWithoutStoryInput[] | StoryPanelUncheckedCreateWithoutStoryInput[]
    connectOrCreate?: StoryPanelCreateOrConnectWithoutStoryInput | StoryPanelCreateOrConnectWithoutStoryInput[]
    createMany?: StoryPanelCreateManyStoryInputEnvelope
    connect?: StoryPanelWhereUniqueInput | StoryPanelWhereUniqueInput[]
  }

  export type StorySubmissionCreateNestedManyWithoutStoryInput = {
    create?: XOR<StorySubmissionCreateWithoutStoryInput, StorySubmissionUncheckedCreateWithoutStoryInput> | StorySubmissionCreateWithoutStoryInput[] | StorySubmissionUncheckedCreateWithoutStoryInput[]
    connectOrCreate?: StorySubmissionCreateOrConnectWithoutStoryInput | StorySubmissionCreateOrConnectWithoutStoryInput[]
    createMany?: StorySubmissionCreateManyStoryInputEnvelope
    connect?: StorySubmissionWhereUniqueInput | StorySubmissionWhereUniqueInput[]
  }

  export type StoryPanelUncheckedCreateNestedManyWithoutStoryInput = {
    create?: XOR<StoryPanelCreateWithoutStoryInput, StoryPanelUncheckedCreateWithoutStoryInput> | StoryPanelCreateWithoutStoryInput[] | StoryPanelUncheckedCreateWithoutStoryInput[]
    connectOrCreate?: StoryPanelCreateOrConnectWithoutStoryInput | StoryPanelCreateOrConnectWithoutStoryInput[]
    createMany?: StoryPanelCreateManyStoryInputEnvelope
    connect?: StoryPanelWhereUniqueInput | StoryPanelWhereUniqueInput[]
  }

  export type StorySubmissionUncheckedCreateNestedManyWithoutStoryInput = {
    create?: XOR<StorySubmissionCreateWithoutStoryInput, StorySubmissionUncheckedCreateWithoutStoryInput> | StorySubmissionCreateWithoutStoryInput[] | StorySubmissionUncheckedCreateWithoutStoryInput[]
    connectOrCreate?: StorySubmissionCreateOrConnectWithoutStoryInput | StorySubmissionCreateOrConnectWithoutStoryInput[]
    createMany?: StorySubmissionCreateManyStoryInputEnvelope
    connect?: StorySubmissionWhereUniqueInput | StorySubmissionWhereUniqueInput[]
  }

  export type StoryUpdatetagsInput = {
    set?: string[]
    push?: string | string[]
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type EnumStoryStatusFieldUpdateOperationsInput = {
    set?: $Enums.StoryStatus
  }

  export type StoryPanelUpdateManyWithoutStoryNestedInput = {
    create?: XOR<StoryPanelCreateWithoutStoryInput, StoryPanelUncheckedCreateWithoutStoryInput> | StoryPanelCreateWithoutStoryInput[] | StoryPanelUncheckedCreateWithoutStoryInput[]
    connectOrCreate?: StoryPanelCreateOrConnectWithoutStoryInput | StoryPanelCreateOrConnectWithoutStoryInput[]
    upsert?: StoryPanelUpsertWithWhereUniqueWithoutStoryInput | StoryPanelUpsertWithWhereUniqueWithoutStoryInput[]
    createMany?: StoryPanelCreateManyStoryInputEnvelope
    set?: StoryPanelWhereUniqueInput | StoryPanelWhereUniqueInput[]
    disconnect?: StoryPanelWhereUniqueInput | StoryPanelWhereUniqueInput[]
    delete?: StoryPanelWhereUniqueInput | StoryPanelWhereUniqueInput[]
    connect?: StoryPanelWhereUniqueInput | StoryPanelWhereUniqueInput[]
    update?: StoryPanelUpdateWithWhereUniqueWithoutStoryInput | StoryPanelUpdateWithWhereUniqueWithoutStoryInput[]
    updateMany?: StoryPanelUpdateManyWithWhereWithoutStoryInput | StoryPanelUpdateManyWithWhereWithoutStoryInput[]
    deleteMany?: StoryPanelScalarWhereInput | StoryPanelScalarWhereInput[]
  }

  export type StorySubmissionUpdateManyWithoutStoryNestedInput = {
    create?: XOR<StorySubmissionCreateWithoutStoryInput, StorySubmissionUncheckedCreateWithoutStoryInput> | StorySubmissionCreateWithoutStoryInput[] | StorySubmissionUncheckedCreateWithoutStoryInput[]
    connectOrCreate?: StorySubmissionCreateOrConnectWithoutStoryInput | StorySubmissionCreateOrConnectWithoutStoryInput[]
    upsert?: StorySubmissionUpsertWithWhereUniqueWithoutStoryInput | StorySubmissionUpsertWithWhereUniqueWithoutStoryInput[]
    createMany?: StorySubmissionCreateManyStoryInputEnvelope
    set?: StorySubmissionWhereUniqueInput | StorySubmissionWhereUniqueInput[]
    disconnect?: StorySubmissionWhereUniqueInput | StorySubmissionWhereUniqueInput[]
    delete?: StorySubmissionWhereUniqueInput | StorySubmissionWhereUniqueInput[]
    connect?: StorySubmissionWhereUniqueInput | StorySubmissionWhereUniqueInput[]
    update?: StorySubmissionUpdateWithWhereUniqueWithoutStoryInput | StorySubmissionUpdateWithWhereUniqueWithoutStoryInput[]
    updateMany?: StorySubmissionUpdateManyWithWhereWithoutStoryInput | StorySubmissionUpdateManyWithWhereWithoutStoryInput[]
    deleteMany?: StorySubmissionScalarWhereInput | StorySubmissionScalarWhereInput[]
  }

  export type StoryPanelUncheckedUpdateManyWithoutStoryNestedInput = {
    create?: XOR<StoryPanelCreateWithoutStoryInput, StoryPanelUncheckedCreateWithoutStoryInput> | StoryPanelCreateWithoutStoryInput[] | StoryPanelUncheckedCreateWithoutStoryInput[]
    connectOrCreate?: StoryPanelCreateOrConnectWithoutStoryInput | StoryPanelCreateOrConnectWithoutStoryInput[]
    upsert?: StoryPanelUpsertWithWhereUniqueWithoutStoryInput | StoryPanelUpsertWithWhereUniqueWithoutStoryInput[]
    createMany?: StoryPanelCreateManyStoryInputEnvelope
    set?: StoryPanelWhereUniqueInput | StoryPanelWhereUniqueInput[]
    disconnect?: StoryPanelWhereUniqueInput | StoryPanelWhereUniqueInput[]
    delete?: StoryPanelWhereUniqueInput | StoryPanelWhereUniqueInput[]
    connect?: StoryPanelWhereUniqueInput | StoryPanelWhereUniqueInput[]
    update?: StoryPanelUpdateWithWhereUniqueWithoutStoryInput | StoryPanelUpdateWithWhereUniqueWithoutStoryInput[]
    updateMany?: StoryPanelUpdateManyWithWhereWithoutStoryInput | StoryPanelUpdateManyWithWhereWithoutStoryInput[]
    deleteMany?: StoryPanelScalarWhereInput | StoryPanelScalarWhereInput[]
  }

  export type StorySubmissionUncheckedUpdateManyWithoutStoryNestedInput = {
    create?: XOR<StorySubmissionCreateWithoutStoryInput, StorySubmissionUncheckedCreateWithoutStoryInput> | StorySubmissionCreateWithoutStoryInput[] | StorySubmissionUncheckedCreateWithoutStoryInput[]
    connectOrCreate?: StorySubmissionCreateOrConnectWithoutStoryInput | StorySubmissionCreateOrConnectWithoutStoryInput[]
    upsert?: StorySubmissionUpsertWithWhereUniqueWithoutStoryInput | StorySubmissionUpsertWithWhereUniqueWithoutStoryInput[]
    createMany?: StorySubmissionCreateManyStoryInputEnvelope
    set?: StorySubmissionWhereUniqueInput | StorySubmissionWhereUniqueInput[]
    disconnect?: StorySubmissionWhereUniqueInput | StorySubmissionWhereUniqueInput[]
    delete?: StorySubmissionWhereUniqueInput | StorySubmissionWhereUniqueInput[]
    connect?: StorySubmissionWhereUniqueInput | StorySubmissionWhereUniqueInput[]
    update?: StorySubmissionUpdateWithWhereUniqueWithoutStoryInput | StorySubmissionUpdateWithWhereUniqueWithoutStoryInput[]
    updateMany?: StorySubmissionUpdateManyWithWhereWithoutStoryInput | StorySubmissionUpdateManyWithWhereWithoutStoryInput[]
    deleteMany?: StorySubmissionScalarWhereInput | StorySubmissionScalarWhereInput[]
  }

  export type StoryCreateNestedOneWithoutPanelsInput = {
    create?: XOR<StoryCreateWithoutPanelsInput, StoryUncheckedCreateWithoutPanelsInput>
    connectOrCreate?: StoryCreateOrConnectWithoutPanelsInput
    connect?: StoryWhereUniqueInput
  }

  export type StoryUpdateOneRequiredWithoutPanelsNestedInput = {
    create?: XOR<StoryCreateWithoutPanelsInput, StoryUncheckedCreateWithoutPanelsInput>
    connectOrCreate?: StoryCreateOrConnectWithoutPanelsInput
    upsert?: StoryUpsertWithoutPanelsInput
    connect?: StoryWhereUniqueInput
    update?: XOR<XOR<StoryUpdateToOneWithWhereWithoutPanelsInput, StoryUpdateWithoutPanelsInput>, StoryUncheckedUpdateWithoutPanelsInput>
  }

  export type StoryRecordingCreateNestedManyWithoutSubmissionInput = {
    create?: XOR<StoryRecordingCreateWithoutSubmissionInput, StoryRecordingUncheckedCreateWithoutSubmissionInput> | StoryRecordingCreateWithoutSubmissionInput[] | StoryRecordingUncheckedCreateWithoutSubmissionInput[]
    connectOrCreate?: StoryRecordingCreateOrConnectWithoutSubmissionInput | StoryRecordingCreateOrConnectWithoutSubmissionInput[]
    createMany?: StoryRecordingCreateManySubmissionInputEnvelope
    connect?: StoryRecordingWhereUniqueInput | StoryRecordingWhereUniqueInput[]
  }

  export type StoryCreateNestedOneWithoutSubmissionsInput = {
    create?: XOR<StoryCreateWithoutSubmissionsInput, StoryUncheckedCreateWithoutSubmissionsInput>
    connectOrCreate?: StoryCreateOrConnectWithoutSubmissionsInput
    connect?: StoryWhereUniqueInput
  }

  export type StoryRecordingUncheckedCreateNestedManyWithoutSubmissionInput = {
    create?: XOR<StoryRecordingCreateWithoutSubmissionInput, StoryRecordingUncheckedCreateWithoutSubmissionInput> | StoryRecordingCreateWithoutSubmissionInput[] | StoryRecordingUncheckedCreateWithoutSubmissionInput[]
    connectOrCreate?: StoryRecordingCreateOrConnectWithoutSubmissionInput | StoryRecordingCreateOrConnectWithoutSubmissionInput[]
    createMany?: StoryRecordingCreateManySubmissionInputEnvelope
    connect?: StoryRecordingWhereUniqueInput | StoryRecordingWhereUniqueInput[]
  }

  export type EnumStorySubmissionStatusFieldUpdateOperationsInput = {
    set?: $Enums.StorySubmissionStatus
  }

  export type StoryRecordingUpdateManyWithoutSubmissionNestedInput = {
    create?: XOR<StoryRecordingCreateWithoutSubmissionInput, StoryRecordingUncheckedCreateWithoutSubmissionInput> | StoryRecordingCreateWithoutSubmissionInput[] | StoryRecordingUncheckedCreateWithoutSubmissionInput[]
    connectOrCreate?: StoryRecordingCreateOrConnectWithoutSubmissionInput | StoryRecordingCreateOrConnectWithoutSubmissionInput[]
    upsert?: StoryRecordingUpsertWithWhereUniqueWithoutSubmissionInput | StoryRecordingUpsertWithWhereUniqueWithoutSubmissionInput[]
    createMany?: StoryRecordingCreateManySubmissionInputEnvelope
    set?: StoryRecordingWhereUniqueInput | StoryRecordingWhereUniqueInput[]
    disconnect?: StoryRecordingWhereUniqueInput | StoryRecordingWhereUniqueInput[]
    delete?: StoryRecordingWhereUniqueInput | StoryRecordingWhereUniqueInput[]
    connect?: StoryRecordingWhereUniqueInput | StoryRecordingWhereUniqueInput[]
    update?: StoryRecordingUpdateWithWhereUniqueWithoutSubmissionInput | StoryRecordingUpdateWithWhereUniqueWithoutSubmissionInput[]
    updateMany?: StoryRecordingUpdateManyWithWhereWithoutSubmissionInput | StoryRecordingUpdateManyWithWhereWithoutSubmissionInput[]
    deleteMany?: StoryRecordingScalarWhereInput | StoryRecordingScalarWhereInput[]
  }

  export type StoryUpdateOneRequiredWithoutSubmissionsNestedInput = {
    create?: XOR<StoryCreateWithoutSubmissionsInput, StoryUncheckedCreateWithoutSubmissionsInput>
    connectOrCreate?: StoryCreateOrConnectWithoutSubmissionsInput
    upsert?: StoryUpsertWithoutSubmissionsInput
    connect?: StoryWhereUniqueInput
    update?: XOR<XOR<StoryUpdateToOneWithWhereWithoutSubmissionsInput, StoryUpdateWithoutSubmissionsInput>, StoryUncheckedUpdateWithoutSubmissionsInput>
  }

  export type StoryRecordingUncheckedUpdateManyWithoutSubmissionNestedInput = {
    create?: XOR<StoryRecordingCreateWithoutSubmissionInput, StoryRecordingUncheckedCreateWithoutSubmissionInput> | StoryRecordingCreateWithoutSubmissionInput[] | StoryRecordingUncheckedCreateWithoutSubmissionInput[]
    connectOrCreate?: StoryRecordingCreateOrConnectWithoutSubmissionInput | StoryRecordingCreateOrConnectWithoutSubmissionInput[]
    upsert?: StoryRecordingUpsertWithWhereUniqueWithoutSubmissionInput | StoryRecordingUpsertWithWhereUniqueWithoutSubmissionInput[]
    createMany?: StoryRecordingCreateManySubmissionInputEnvelope
    set?: StoryRecordingWhereUniqueInput | StoryRecordingWhereUniqueInput[]
    disconnect?: StoryRecordingWhereUniqueInput | StoryRecordingWhereUniqueInput[]
    delete?: StoryRecordingWhereUniqueInput | StoryRecordingWhereUniqueInput[]
    connect?: StoryRecordingWhereUniqueInput | StoryRecordingWhereUniqueInput[]
    update?: StoryRecordingUpdateWithWhereUniqueWithoutSubmissionInput | StoryRecordingUpdateWithWhereUniqueWithoutSubmissionInput[]
    updateMany?: StoryRecordingUpdateManyWithWhereWithoutSubmissionInput | StoryRecordingUpdateManyWithWhereWithoutSubmissionInput[]
    deleteMany?: StoryRecordingScalarWhereInput | StoryRecordingScalarWhereInput[]
  }

  export type StorySubmissionCreateNestedOneWithoutRecordingsInput = {
    create?: XOR<StorySubmissionCreateWithoutRecordingsInput, StorySubmissionUncheckedCreateWithoutRecordingsInput>
    connectOrCreate?: StorySubmissionCreateOrConnectWithoutRecordingsInput
    connect?: StorySubmissionWhereUniqueInput
  }

  export type StorySubmissionUpdateOneRequiredWithoutRecordingsNestedInput = {
    create?: XOR<StorySubmissionCreateWithoutRecordingsInput, StorySubmissionUncheckedCreateWithoutRecordingsInput>
    connectOrCreate?: StorySubmissionCreateOrConnectWithoutRecordingsInput
    upsert?: StorySubmissionUpsertWithoutRecordingsInput
    connect?: StorySubmissionWhereUniqueInput
    update?: XOR<XOR<StorySubmissionUpdateToOneWithWhereWithoutRecordingsInput, StorySubmissionUpdateWithoutRecordingsInput>, StorySubmissionUncheckedUpdateWithoutRecordingsInput>
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedEnumQuestionTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.QuestionType | EnumQuestionTypeFieldRefInput<$PrismaModel>
    in?: $Enums.QuestionType[] | ListEnumQuestionTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.QuestionType[] | ListEnumQuestionTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumQuestionTypeFilter<$PrismaModel> | $Enums.QuestionType
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedEnumQuestionTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.QuestionType | EnumQuestionTypeFieldRefInput<$PrismaModel>
    in?: $Enums.QuestionType[] | ListEnumQuestionTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.QuestionType[] | ListEnumQuestionTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumQuestionTypeWithAggregatesFilter<$PrismaModel> | $Enums.QuestionType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumQuestionTypeFilter<$PrismaModel>
    _max?: NestedEnumQuestionTypeFilter<$PrismaModel>
  }
  export type NestedJsonNullableFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<NestedJsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedEnumStoryStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.StoryStatus | EnumStoryStatusFieldRefInput<$PrismaModel>
    in?: $Enums.StoryStatus[] | ListEnumStoryStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.StoryStatus[] | ListEnumStoryStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumStoryStatusFilter<$PrismaModel> | $Enums.StoryStatus
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedEnumStoryStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.StoryStatus | EnumStoryStatusFieldRefInput<$PrismaModel>
    in?: $Enums.StoryStatus[] | ListEnumStoryStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.StoryStatus[] | ListEnumStoryStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumStoryStatusWithAggregatesFilter<$PrismaModel> | $Enums.StoryStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumStoryStatusFilter<$PrismaModel>
    _max?: NestedEnumStoryStatusFilter<$PrismaModel>
  }

  export type NestedEnumStorySubmissionStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.StorySubmissionStatus | EnumStorySubmissionStatusFieldRefInput<$PrismaModel>
    in?: $Enums.StorySubmissionStatus[] | ListEnumStorySubmissionStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.StorySubmissionStatus[] | ListEnumStorySubmissionStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumStorySubmissionStatusFilter<$PrismaModel> | $Enums.StorySubmissionStatus
  }

  export type NestedEnumStorySubmissionStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.StorySubmissionStatus | EnumStorySubmissionStatusFieldRefInput<$PrismaModel>
    in?: $Enums.StorySubmissionStatus[] | ListEnumStorySubmissionStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.StorySubmissionStatus[] | ListEnumStorySubmissionStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumStorySubmissionStatusWithAggregatesFilter<$PrismaModel> | $Enums.StorySubmissionStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumStorySubmissionStatusFilter<$PrismaModel>
    _max?: NestedEnumStorySubmissionStatusFilter<$PrismaModel>
  }

  export type QuestionCreateWithoutQuizInput = {
    id?: string
    question: string
    imageUrl?: string | null
    answers?: QuestionCreateanswersInput | string[]
    correctAnswer: string
    type?: $Enums.QuestionType
  }

  export type QuestionUncheckedCreateWithoutQuizInput = {
    id?: string
    question: string
    imageUrl?: string | null
    answers?: QuestionCreateanswersInput | string[]
    correctAnswer: string
    type?: $Enums.QuestionType
  }

  export type QuestionCreateOrConnectWithoutQuizInput = {
    where: QuestionWhereUniqueInput
    create: XOR<QuestionCreateWithoutQuizInput, QuestionUncheckedCreateWithoutQuizInput>
  }

  export type QuestionCreateManyQuizInputEnvelope = {
    data: QuestionCreateManyQuizInput | QuestionCreateManyQuizInput[]
    skipDuplicates?: boolean
  }

  export type QuizLikeCreateWithoutQuizInput = {
    id?: string
    userId: string
    createdAt?: Date | string
  }

  export type QuizLikeUncheckedCreateWithoutQuizInput = {
    id?: string
    userId: string
    createdAt?: Date | string
  }

  export type QuizLikeCreateOrConnectWithoutQuizInput = {
    where: QuizLikeWhereUniqueInput
    create: XOR<QuizLikeCreateWithoutQuizInput, QuizLikeUncheckedCreateWithoutQuizInput>
  }

  export type QuizLikeCreateManyQuizInputEnvelope = {
    data: QuizLikeCreateManyQuizInput | QuizLikeCreateManyQuizInput[]
    skipDuplicates?: boolean
  }

  export type QuizFavoriteCreateWithoutQuizInput = {
    id?: string
    userId: string
    createdAt?: Date | string
  }

  export type QuizFavoriteUncheckedCreateWithoutQuizInput = {
    id?: string
    userId: string
    createdAt?: Date | string
  }

  export type QuizFavoriteCreateOrConnectWithoutQuizInput = {
    where: QuizFavoriteWhereUniqueInput
    create: XOR<QuizFavoriteCreateWithoutQuizInput, QuizFavoriteUncheckedCreateWithoutQuizInput>
  }

  export type QuizFavoriteCreateManyQuizInputEnvelope = {
    data: QuizFavoriteCreateManyQuizInput | QuizFavoriteCreateManyQuizInput[]
    skipDuplicates?: boolean
  }

  export type QuestionUpsertWithWhereUniqueWithoutQuizInput = {
    where: QuestionWhereUniqueInput
    update: XOR<QuestionUpdateWithoutQuizInput, QuestionUncheckedUpdateWithoutQuizInput>
    create: XOR<QuestionCreateWithoutQuizInput, QuestionUncheckedCreateWithoutQuizInput>
  }

  export type QuestionUpdateWithWhereUniqueWithoutQuizInput = {
    where: QuestionWhereUniqueInput
    data: XOR<QuestionUpdateWithoutQuizInput, QuestionUncheckedUpdateWithoutQuizInput>
  }

  export type QuestionUpdateManyWithWhereWithoutQuizInput = {
    where: QuestionScalarWhereInput
    data: XOR<QuestionUpdateManyMutationInput, QuestionUncheckedUpdateManyWithoutQuizInput>
  }

  export type QuestionScalarWhereInput = {
    AND?: QuestionScalarWhereInput | QuestionScalarWhereInput[]
    OR?: QuestionScalarWhereInput[]
    NOT?: QuestionScalarWhereInput | QuestionScalarWhereInput[]
    id?: StringFilter<"Question"> | string
    question?: StringFilter<"Question"> | string
    imageUrl?: StringNullableFilter<"Question"> | string | null
    answers?: StringNullableListFilter<"Question">
    correctAnswer?: StringFilter<"Question"> | string
    type?: EnumQuestionTypeFilter<"Question"> | $Enums.QuestionType
    quizId?: StringNullableFilter<"Question"> | string | null
  }

  export type QuizLikeUpsertWithWhereUniqueWithoutQuizInput = {
    where: QuizLikeWhereUniqueInput
    update: XOR<QuizLikeUpdateWithoutQuizInput, QuizLikeUncheckedUpdateWithoutQuizInput>
    create: XOR<QuizLikeCreateWithoutQuizInput, QuizLikeUncheckedCreateWithoutQuizInput>
  }

  export type QuizLikeUpdateWithWhereUniqueWithoutQuizInput = {
    where: QuizLikeWhereUniqueInput
    data: XOR<QuizLikeUpdateWithoutQuizInput, QuizLikeUncheckedUpdateWithoutQuizInput>
  }

  export type QuizLikeUpdateManyWithWhereWithoutQuizInput = {
    where: QuizLikeScalarWhereInput
    data: XOR<QuizLikeUpdateManyMutationInput, QuizLikeUncheckedUpdateManyWithoutQuizInput>
  }

  export type QuizLikeScalarWhereInput = {
    AND?: QuizLikeScalarWhereInput | QuizLikeScalarWhereInput[]
    OR?: QuizLikeScalarWhereInput[]
    NOT?: QuizLikeScalarWhereInput | QuizLikeScalarWhereInput[]
    id?: StringFilter<"QuizLike"> | string
    quizId?: StringFilter<"QuizLike"> | string
    userId?: StringFilter<"QuizLike"> | string
    createdAt?: DateTimeFilter<"QuizLike"> | Date | string
  }

  export type QuizFavoriteUpsertWithWhereUniqueWithoutQuizInput = {
    where: QuizFavoriteWhereUniqueInput
    update: XOR<QuizFavoriteUpdateWithoutQuizInput, QuizFavoriteUncheckedUpdateWithoutQuizInput>
    create: XOR<QuizFavoriteCreateWithoutQuizInput, QuizFavoriteUncheckedCreateWithoutQuizInput>
  }

  export type QuizFavoriteUpdateWithWhereUniqueWithoutQuizInput = {
    where: QuizFavoriteWhereUniqueInput
    data: XOR<QuizFavoriteUpdateWithoutQuizInput, QuizFavoriteUncheckedUpdateWithoutQuizInput>
  }

  export type QuizFavoriteUpdateManyWithWhereWithoutQuizInput = {
    where: QuizFavoriteScalarWhereInput
    data: XOR<QuizFavoriteUpdateManyMutationInput, QuizFavoriteUncheckedUpdateManyWithoutQuizInput>
  }

  export type QuizFavoriteScalarWhereInput = {
    AND?: QuizFavoriteScalarWhereInput | QuizFavoriteScalarWhereInput[]
    OR?: QuizFavoriteScalarWhereInput[]
    NOT?: QuizFavoriteScalarWhereInput | QuizFavoriteScalarWhereInput[]
    id?: StringFilter<"QuizFavorite"> | string
    quizId?: StringFilter<"QuizFavorite"> | string
    userId?: StringFilter<"QuizFavorite"> | string
    createdAt?: DateTimeFilter<"QuizFavorite"> | Date | string
  }

  export type QuizCreateWithoutLikesInput = {
    id?: string
    title: string
    description?: string | null
    imageUrl?: string | null
    quizType?: $Enums.QuestionType
    tags?: QuizCreatetagsInput | string[]
    statistics?: NullableJsonNullValueInput | InputJsonValue
    defaultSettings?: NullableJsonNullValueInput | InputJsonValue
    authorId?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    questions?: QuestionCreateNestedManyWithoutQuizInput
    favorites?: QuizFavoriteCreateNestedManyWithoutQuizInput
  }

  export type QuizUncheckedCreateWithoutLikesInput = {
    id?: string
    title: string
    description?: string | null
    imageUrl?: string | null
    quizType?: $Enums.QuestionType
    tags?: QuizCreatetagsInput | string[]
    statistics?: NullableJsonNullValueInput | InputJsonValue
    defaultSettings?: NullableJsonNullValueInput | InputJsonValue
    authorId?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    questions?: QuestionUncheckedCreateNestedManyWithoutQuizInput
    favorites?: QuizFavoriteUncheckedCreateNestedManyWithoutQuizInput
  }

  export type QuizCreateOrConnectWithoutLikesInput = {
    where: QuizWhereUniqueInput
    create: XOR<QuizCreateWithoutLikesInput, QuizUncheckedCreateWithoutLikesInput>
  }

  export type QuizUpsertWithoutLikesInput = {
    update: XOR<QuizUpdateWithoutLikesInput, QuizUncheckedUpdateWithoutLikesInput>
    create: XOR<QuizCreateWithoutLikesInput, QuizUncheckedCreateWithoutLikesInput>
    where?: QuizWhereInput
  }

  export type QuizUpdateToOneWithWhereWithoutLikesInput = {
    where?: QuizWhereInput
    data: XOR<QuizUpdateWithoutLikesInput, QuizUncheckedUpdateWithoutLikesInput>
  }

  export type QuizUpdateWithoutLikesInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    quizType?: EnumQuestionTypeFieldUpdateOperationsInput | $Enums.QuestionType
    tags?: QuizUpdatetagsInput | string[]
    statistics?: NullableJsonNullValueInput | InputJsonValue
    defaultSettings?: NullableJsonNullValueInput | InputJsonValue
    authorId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    questions?: QuestionUpdateManyWithoutQuizNestedInput
    favorites?: QuizFavoriteUpdateManyWithoutQuizNestedInput
  }

  export type QuizUncheckedUpdateWithoutLikesInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    quizType?: EnumQuestionTypeFieldUpdateOperationsInput | $Enums.QuestionType
    tags?: QuizUpdatetagsInput | string[]
    statistics?: NullableJsonNullValueInput | InputJsonValue
    defaultSettings?: NullableJsonNullValueInput | InputJsonValue
    authorId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    questions?: QuestionUncheckedUpdateManyWithoutQuizNestedInput
    favorites?: QuizFavoriteUncheckedUpdateManyWithoutQuizNestedInput
  }

  export type QuizCreateWithoutFavoritesInput = {
    id?: string
    title: string
    description?: string | null
    imageUrl?: string | null
    quizType?: $Enums.QuestionType
    tags?: QuizCreatetagsInput | string[]
    statistics?: NullableJsonNullValueInput | InputJsonValue
    defaultSettings?: NullableJsonNullValueInput | InputJsonValue
    authorId?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    questions?: QuestionCreateNestedManyWithoutQuizInput
    likes?: QuizLikeCreateNestedManyWithoutQuizInput
  }

  export type QuizUncheckedCreateWithoutFavoritesInput = {
    id?: string
    title: string
    description?: string | null
    imageUrl?: string | null
    quizType?: $Enums.QuestionType
    tags?: QuizCreatetagsInput | string[]
    statistics?: NullableJsonNullValueInput | InputJsonValue
    defaultSettings?: NullableJsonNullValueInput | InputJsonValue
    authorId?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    questions?: QuestionUncheckedCreateNestedManyWithoutQuizInput
    likes?: QuizLikeUncheckedCreateNestedManyWithoutQuizInput
  }

  export type QuizCreateOrConnectWithoutFavoritesInput = {
    where: QuizWhereUniqueInput
    create: XOR<QuizCreateWithoutFavoritesInput, QuizUncheckedCreateWithoutFavoritesInput>
  }

  export type QuizUpsertWithoutFavoritesInput = {
    update: XOR<QuizUpdateWithoutFavoritesInput, QuizUncheckedUpdateWithoutFavoritesInput>
    create: XOR<QuizCreateWithoutFavoritesInput, QuizUncheckedCreateWithoutFavoritesInput>
    where?: QuizWhereInput
  }

  export type QuizUpdateToOneWithWhereWithoutFavoritesInput = {
    where?: QuizWhereInput
    data: XOR<QuizUpdateWithoutFavoritesInput, QuizUncheckedUpdateWithoutFavoritesInput>
  }

  export type QuizUpdateWithoutFavoritesInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    quizType?: EnumQuestionTypeFieldUpdateOperationsInput | $Enums.QuestionType
    tags?: QuizUpdatetagsInput | string[]
    statistics?: NullableJsonNullValueInput | InputJsonValue
    defaultSettings?: NullableJsonNullValueInput | InputJsonValue
    authorId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    questions?: QuestionUpdateManyWithoutQuizNestedInput
    likes?: QuizLikeUpdateManyWithoutQuizNestedInput
  }

  export type QuizUncheckedUpdateWithoutFavoritesInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    quizType?: EnumQuestionTypeFieldUpdateOperationsInput | $Enums.QuestionType
    tags?: QuizUpdatetagsInput | string[]
    statistics?: NullableJsonNullValueInput | InputJsonValue
    defaultSettings?: NullableJsonNullValueInput | InputJsonValue
    authorId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    questions?: QuestionUncheckedUpdateManyWithoutQuizNestedInput
    likes?: QuizLikeUncheckedUpdateManyWithoutQuizNestedInput
  }

  export type QuizCreateWithoutQuestionsInput = {
    id?: string
    title: string
    description?: string | null
    imageUrl?: string | null
    quizType?: $Enums.QuestionType
    tags?: QuizCreatetagsInput | string[]
    statistics?: NullableJsonNullValueInput | InputJsonValue
    defaultSettings?: NullableJsonNullValueInput | InputJsonValue
    authorId?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    likes?: QuizLikeCreateNestedManyWithoutQuizInput
    favorites?: QuizFavoriteCreateNestedManyWithoutQuizInput
  }

  export type QuizUncheckedCreateWithoutQuestionsInput = {
    id?: string
    title: string
    description?: string | null
    imageUrl?: string | null
    quizType?: $Enums.QuestionType
    tags?: QuizCreatetagsInput | string[]
    statistics?: NullableJsonNullValueInput | InputJsonValue
    defaultSettings?: NullableJsonNullValueInput | InputJsonValue
    authorId?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    likes?: QuizLikeUncheckedCreateNestedManyWithoutQuizInput
    favorites?: QuizFavoriteUncheckedCreateNestedManyWithoutQuizInput
  }

  export type QuizCreateOrConnectWithoutQuestionsInput = {
    where: QuizWhereUniqueInput
    create: XOR<QuizCreateWithoutQuestionsInput, QuizUncheckedCreateWithoutQuestionsInput>
  }

  export type QuizUpsertWithoutQuestionsInput = {
    update: XOR<QuizUpdateWithoutQuestionsInput, QuizUncheckedUpdateWithoutQuestionsInput>
    create: XOR<QuizCreateWithoutQuestionsInput, QuizUncheckedCreateWithoutQuestionsInput>
    where?: QuizWhereInput
  }

  export type QuizUpdateToOneWithWhereWithoutQuestionsInput = {
    where?: QuizWhereInput
    data: XOR<QuizUpdateWithoutQuestionsInput, QuizUncheckedUpdateWithoutQuestionsInput>
  }

  export type QuizUpdateWithoutQuestionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    quizType?: EnumQuestionTypeFieldUpdateOperationsInput | $Enums.QuestionType
    tags?: QuizUpdatetagsInput | string[]
    statistics?: NullableJsonNullValueInput | InputJsonValue
    defaultSettings?: NullableJsonNullValueInput | InputJsonValue
    authorId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    likes?: QuizLikeUpdateManyWithoutQuizNestedInput
    favorites?: QuizFavoriteUpdateManyWithoutQuizNestedInput
  }

  export type QuizUncheckedUpdateWithoutQuestionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    quizType?: EnumQuestionTypeFieldUpdateOperationsInput | $Enums.QuestionType
    tags?: QuizUpdatetagsInput | string[]
    statistics?: NullableJsonNullValueInput | InputJsonValue
    defaultSettings?: NullableJsonNullValueInput | InputJsonValue
    authorId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    likes?: QuizLikeUncheckedUpdateManyWithoutQuizNestedInput
    favorites?: QuizFavoriteUncheckedUpdateManyWithoutQuizNestedInput
  }

  export type StoryPanelCreateWithoutStoryInput = {
    id?: string
    order: number
    imageUrl?: string | null
    sceneDescription: string
    imagePrompt?: string | null
    exampleSentence?: string | null
    mouth?: NullableJsonNullValueInput | InputJsonValue
  }

  export type StoryPanelUncheckedCreateWithoutStoryInput = {
    id?: string
    order: number
    imageUrl?: string | null
    sceneDescription: string
    imagePrompt?: string | null
    exampleSentence?: string | null
    mouth?: NullableJsonNullValueInput | InputJsonValue
  }

  export type StoryPanelCreateOrConnectWithoutStoryInput = {
    where: StoryPanelWhereUniqueInput
    create: XOR<StoryPanelCreateWithoutStoryInput, StoryPanelUncheckedCreateWithoutStoryInput>
  }

  export type StoryPanelCreateManyStoryInputEnvelope = {
    data: StoryPanelCreateManyStoryInput | StoryPanelCreateManyStoryInput[]
    skipDuplicates?: boolean
  }

  export type StorySubmissionCreateWithoutStoryInput = {
    id?: string
    studentName: string
    status?: $Enums.StorySubmissionStatus
    createdAt?: Date | string
    recordings?: StoryRecordingCreateNestedManyWithoutSubmissionInput
  }

  export type StorySubmissionUncheckedCreateWithoutStoryInput = {
    id?: string
    studentName: string
    status?: $Enums.StorySubmissionStatus
    createdAt?: Date | string
    recordings?: StoryRecordingUncheckedCreateNestedManyWithoutSubmissionInput
  }

  export type StorySubmissionCreateOrConnectWithoutStoryInput = {
    where: StorySubmissionWhereUniqueInput
    create: XOR<StorySubmissionCreateWithoutStoryInput, StorySubmissionUncheckedCreateWithoutStoryInput>
  }

  export type StorySubmissionCreateManyStoryInputEnvelope = {
    data: StorySubmissionCreateManyStoryInput | StorySubmissionCreateManyStoryInput[]
    skipDuplicates?: boolean
  }

  export type StoryPanelUpsertWithWhereUniqueWithoutStoryInput = {
    where: StoryPanelWhereUniqueInput
    update: XOR<StoryPanelUpdateWithoutStoryInput, StoryPanelUncheckedUpdateWithoutStoryInput>
    create: XOR<StoryPanelCreateWithoutStoryInput, StoryPanelUncheckedCreateWithoutStoryInput>
  }

  export type StoryPanelUpdateWithWhereUniqueWithoutStoryInput = {
    where: StoryPanelWhereUniqueInput
    data: XOR<StoryPanelUpdateWithoutStoryInput, StoryPanelUncheckedUpdateWithoutStoryInput>
  }

  export type StoryPanelUpdateManyWithWhereWithoutStoryInput = {
    where: StoryPanelScalarWhereInput
    data: XOR<StoryPanelUpdateManyMutationInput, StoryPanelUncheckedUpdateManyWithoutStoryInput>
  }

  export type StoryPanelScalarWhereInput = {
    AND?: StoryPanelScalarWhereInput | StoryPanelScalarWhereInput[]
    OR?: StoryPanelScalarWhereInput[]
    NOT?: StoryPanelScalarWhereInput | StoryPanelScalarWhereInput[]
    id?: StringFilter<"StoryPanel"> | string
    storyId?: StringFilter<"StoryPanel"> | string
    order?: IntFilter<"StoryPanel"> | number
    imageUrl?: StringNullableFilter<"StoryPanel"> | string | null
    sceneDescription?: StringFilter<"StoryPanel"> | string
    imagePrompt?: StringNullableFilter<"StoryPanel"> | string | null
    exampleSentence?: StringNullableFilter<"StoryPanel"> | string | null
    mouth?: JsonNullableFilter<"StoryPanel">
  }

  export type StorySubmissionUpsertWithWhereUniqueWithoutStoryInput = {
    where: StorySubmissionWhereUniqueInput
    update: XOR<StorySubmissionUpdateWithoutStoryInput, StorySubmissionUncheckedUpdateWithoutStoryInput>
    create: XOR<StorySubmissionCreateWithoutStoryInput, StorySubmissionUncheckedCreateWithoutStoryInput>
  }

  export type StorySubmissionUpdateWithWhereUniqueWithoutStoryInput = {
    where: StorySubmissionWhereUniqueInput
    data: XOR<StorySubmissionUpdateWithoutStoryInput, StorySubmissionUncheckedUpdateWithoutStoryInput>
  }

  export type StorySubmissionUpdateManyWithWhereWithoutStoryInput = {
    where: StorySubmissionScalarWhereInput
    data: XOR<StorySubmissionUpdateManyMutationInput, StorySubmissionUncheckedUpdateManyWithoutStoryInput>
  }

  export type StorySubmissionScalarWhereInput = {
    AND?: StorySubmissionScalarWhereInput | StorySubmissionScalarWhereInput[]
    OR?: StorySubmissionScalarWhereInput[]
    NOT?: StorySubmissionScalarWhereInput | StorySubmissionScalarWhereInput[]
    id?: StringFilter<"StorySubmission"> | string
    storyId?: StringFilter<"StorySubmission"> | string
    studentName?: StringFilter<"StorySubmission"> | string
    status?: EnumStorySubmissionStatusFilter<"StorySubmission"> | $Enums.StorySubmissionStatus
    createdAt?: DateTimeFilter<"StorySubmission"> | Date | string
  }

  export type StoryCreateWithoutPanelsInput = {
    id?: string
    authorId?: string
    title: string
    topicPrompt: string
    tags?: StoryCreatetagsInput | string[]
    storyType?: string | null
    characterSheet?: string | null
    artStyle?: string | null
    exampleStory?: string | null
    showExampleToStudents?: boolean
    status?: $Enums.StoryStatus
    shareToken: string
    createdAt?: Date | string
    updatedAt?: Date | string
    submissions?: StorySubmissionCreateNestedManyWithoutStoryInput
  }

  export type StoryUncheckedCreateWithoutPanelsInput = {
    id?: string
    authorId?: string
    title: string
    topicPrompt: string
    tags?: StoryCreatetagsInput | string[]
    storyType?: string | null
    characterSheet?: string | null
    artStyle?: string | null
    exampleStory?: string | null
    showExampleToStudents?: boolean
    status?: $Enums.StoryStatus
    shareToken: string
    createdAt?: Date | string
    updatedAt?: Date | string
    submissions?: StorySubmissionUncheckedCreateNestedManyWithoutStoryInput
  }

  export type StoryCreateOrConnectWithoutPanelsInput = {
    where: StoryWhereUniqueInput
    create: XOR<StoryCreateWithoutPanelsInput, StoryUncheckedCreateWithoutPanelsInput>
  }

  export type StoryUpsertWithoutPanelsInput = {
    update: XOR<StoryUpdateWithoutPanelsInput, StoryUncheckedUpdateWithoutPanelsInput>
    create: XOR<StoryCreateWithoutPanelsInput, StoryUncheckedCreateWithoutPanelsInput>
    where?: StoryWhereInput
  }

  export type StoryUpdateToOneWithWhereWithoutPanelsInput = {
    where?: StoryWhereInput
    data: XOR<StoryUpdateWithoutPanelsInput, StoryUncheckedUpdateWithoutPanelsInput>
  }

  export type StoryUpdateWithoutPanelsInput = {
    id?: StringFieldUpdateOperationsInput | string
    authorId?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    topicPrompt?: StringFieldUpdateOperationsInput | string
    tags?: StoryUpdatetagsInput | string[]
    storyType?: NullableStringFieldUpdateOperationsInput | string | null
    characterSheet?: NullableStringFieldUpdateOperationsInput | string | null
    artStyle?: NullableStringFieldUpdateOperationsInput | string | null
    exampleStory?: NullableStringFieldUpdateOperationsInput | string | null
    showExampleToStudents?: BoolFieldUpdateOperationsInput | boolean
    status?: EnumStoryStatusFieldUpdateOperationsInput | $Enums.StoryStatus
    shareToken?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    submissions?: StorySubmissionUpdateManyWithoutStoryNestedInput
  }

  export type StoryUncheckedUpdateWithoutPanelsInput = {
    id?: StringFieldUpdateOperationsInput | string
    authorId?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    topicPrompt?: StringFieldUpdateOperationsInput | string
    tags?: StoryUpdatetagsInput | string[]
    storyType?: NullableStringFieldUpdateOperationsInput | string | null
    characterSheet?: NullableStringFieldUpdateOperationsInput | string | null
    artStyle?: NullableStringFieldUpdateOperationsInput | string | null
    exampleStory?: NullableStringFieldUpdateOperationsInput | string | null
    showExampleToStudents?: BoolFieldUpdateOperationsInput | boolean
    status?: EnumStoryStatusFieldUpdateOperationsInput | $Enums.StoryStatus
    shareToken?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    submissions?: StorySubmissionUncheckedUpdateManyWithoutStoryNestedInput
  }

  export type StoryRecordingCreateWithoutSubmissionInput = {
    id?: string
    panelOrder: number
    audioUrl: string
    mimeType: string
    durationMs: number
    envelope?: NullableJsonNullValueInput | InputJsonValue
  }

  export type StoryRecordingUncheckedCreateWithoutSubmissionInput = {
    id?: string
    panelOrder: number
    audioUrl: string
    mimeType: string
    durationMs: number
    envelope?: NullableJsonNullValueInput | InputJsonValue
  }

  export type StoryRecordingCreateOrConnectWithoutSubmissionInput = {
    where: StoryRecordingWhereUniqueInput
    create: XOR<StoryRecordingCreateWithoutSubmissionInput, StoryRecordingUncheckedCreateWithoutSubmissionInput>
  }

  export type StoryRecordingCreateManySubmissionInputEnvelope = {
    data: StoryRecordingCreateManySubmissionInput | StoryRecordingCreateManySubmissionInput[]
    skipDuplicates?: boolean
  }

  export type StoryCreateWithoutSubmissionsInput = {
    id?: string
    authorId?: string
    title: string
    topicPrompt: string
    tags?: StoryCreatetagsInput | string[]
    storyType?: string | null
    characterSheet?: string | null
    artStyle?: string | null
    exampleStory?: string | null
    showExampleToStudents?: boolean
    status?: $Enums.StoryStatus
    shareToken: string
    createdAt?: Date | string
    updatedAt?: Date | string
    panels?: StoryPanelCreateNestedManyWithoutStoryInput
  }

  export type StoryUncheckedCreateWithoutSubmissionsInput = {
    id?: string
    authorId?: string
    title: string
    topicPrompt: string
    tags?: StoryCreatetagsInput | string[]
    storyType?: string | null
    characterSheet?: string | null
    artStyle?: string | null
    exampleStory?: string | null
    showExampleToStudents?: boolean
    status?: $Enums.StoryStatus
    shareToken: string
    createdAt?: Date | string
    updatedAt?: Date | string
    panels?: StoryPanelUncheckedCreateNestedManyWithoutStoryInput
  }

  export type StoryCreateOrConnectWithoutSubmissionsInput = {
    where: StoryWhereUniqueInput
    create: XOR<StoryCreateWithoutSubmissionsInput, StoryUncheckedCreateWithoutSubmissionsInput>
  }

  export type StoryRecordingUpsertWithWhereUniqueWithoutSubmissionInput = {
    where: StoryRecordingWhereUniqueInput
    update: XOR<StoryRecordingUpdateWithoutSubmissionInput, StoryRecordingUncheckedUpdateWithoutSubmissionInput>
    create: XOR<StoryRecordingCreateWithoutSubmissionInput, StoryRecordingUncheckedCreateWithoutSubmissionInput>
  }

  export type StoryRecordingUpdateWithWhereUniqueWithoutSubmissionInput = {
    where: StoryRecordingWhereUniqueInput
    data: XOR<StoryRecordingUpdateWithoutSubmissionInput, StoryRecordingUncheckedUpdateWithoutSubmissionInput>
  }

  export type StoryRecordingUpdateManyWithWhereWithoutSubmissionInput = {
    where: StoryRecordingScalarWhereInput
    data: XOR<StoryRecordingUpdateManyMutationInput, StoryRecordingUncheckedUpdateManyWithoutSubmissionInput>
  }

  export type StoryRecordingScalarWhereInput = {
    AND?: StoryRecordingScalarWhereInput | StoryRecordingScalarWhereInput[]
    OR?: StoryRecordingScalarWhereInput[]
    NOT?: StoryRecordingScalarWhereInput | StoryRecordingScalarWhereInput[]
    id?: StringFilter<"StoryRecording"> | string
    submissionId?: StringFilter<"StoryRecording"> | string
    panelOrder?: IntFilter<"StoryRecording"> | number
    audioUrl?: StringFilter<"StoryRecording"> | string
    mimeType?: StringFilter<"StoryRecording"> | string
    durationMs?: IntFilter<"StoryRecording"> | number
    envelope?: JsonNullableFilter<"StoryRecording">
  }

  export type StoryUpsertWithoutSubmissionsInput = {
    update: XOR<StoryUpdateWithoutSubmissionsInput, StoryUncheckedUpdateWithoutSubmissionsInput>
    create: XOR<StoryCreateWithoutSubmissionsInput, StoryUncheckedCreateWithoutSubmissionsInput>
    where?: StoryWhereInput
  }

  export type StoryUpdateToOneWithWhereWithoutSubmissionsInput = {
    where?: StoryWhereInput
    data: XOR<StoryUpdateWithoutSubmissionsInput, StoryUncheckedUpdateWithoutSubmissionsInput>
  }

  export type StoryUpdateWithoutSubmissionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    authorId?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    topicPrompt?: StringFieldUpdateOperationsInput | string
    tags?: StoryUpdatetagsInput | string[]
    storyType?: NullableStringFieldUpdateOperationsInput | string | null
    characterSheet?: NullableStringFieldUpdateOperationsInput | string | null
    artStyle?: NullableStringFieldUpdateOperationsInput | string | null
    exampleStory?: NullableStringFieldUpdateOperationsInput | string | null
    showExampleToStudents?: BoolFieldUpdateOperationsInput | boolean
    status?: EnumStoryStatusFieldUpdateOperationsInput | $Enums.StoryStatus
    shareToken?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    panels?: StoryPanelUpdateManyWithoutStoryNestedInput
  }

  export type StoryUncheckedUpdateWithoutSubmissionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    authorId?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    topicPrompt?: StringFieldUpdateOperationsInput | string
    tags?: StoryUpdatetagsInput | string[]
    storyType?: NullableStringFieldUpdateOperationsInput | string | null
    characterSheet?: NullableStringFieldUpdateOperationsInput | string | null
    artStyle?: NullableStringFieldUpdateOperationsInput | string | null
    exampleStory?: NullableStringFieldUpdateOperationsInput | string | null
    showExampleToStudents?: BoolFieldUpdateOperationsInput | boolean
    status?: EnumStoryStatusFieldUpdateOperationsInput | $Enums.StoryStatus
    shareToken?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    panels?: StoryPanelUncheckedUpdateManyWithoutStoryNestedInput
  }

  export type StorySubmissionCreateWithoutRecordingsInput = {
    id?: string
    studentName: string
    status?: $Enums.StorySubmissionStatus
    createdAt?: Date | string
    story: StoryCreateNestedOneWithoutSubmissionsInput
  }

  export type StorySubmissionUncheckedCreateWithoutRecordingsInput = {
    id?: string
    storyId: string
    studentName: string
    status?: $Enums.StorySubmissionStatus
    createdAt?: Date | string
  }

  export type StorySubmissionCreateOrConnectWithoutRecordingsInput = {
    where: StorySubmissionWhereUniqueInput
    create: XOR<StorySubmissionCreateWithoutRecordingsInput, StorySubmissionUncheckedCreateWithoutRecordingsInput>
  }

  export type StorySubmissionUpsertWithoutRecordingsInput = {
    update: XOR<StorySubmissionUpdateWithoutRecordingsInput, StorySubmissionUncheckedUpdateWithoutRecordingsInput>
    create: XOR<StorySubmissionCreateWithoutRecordingsInput, StorySubmissionUncheckedCreateWithoutRecordingsInput>
    where?: StorySubmissionWhereInput
  }

  export type StorySubmissionUpdateToOneWithWhereWithoutRecordingsInput = {
    where?: StorySubmissionWhereInput
    data: XOR<StorySubmissionUpdateWithoutRecordingsInput, StorySubmissionUncheckedUpdateWithoutRecordingsInput>
  }

  export type StorySubmissionUpdateWithoutRecordingsInput = {
    id?: StringFieldUpdateOperationsInput | string
    studentName?: StringFieldUpdateOperationsInput | string
    status?: EnumStorySubmissionStatusFieldUpdateOperationsInput | $Enums.StorySubmissionStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    story?: StoryUpdateOneRequiredWithoutSubmissionsNestedInput
  }

  export type StorySubmissionUncheckedUpdateWithoutRecordingsInput = {
    id?: StringFieldUpdateOperationsInput | string
    storyId?: StringFieldUpdateOperationsInput | string
    studentName?: StringFieldUpdateOperationsInput | string
    status?: EnumStorySubmissionStatusFieldUpdateOperationsInput | $Enums.StorySubmissionStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type QuestionCreateManyQuizInput = {
    id?: string
    question: string
    imageUrl?: string | null
    answers?: QuestionCreateanswersInput | string[]
    correctAnswer: string
    type?: $Enums.QuestionType
  }

  export type QuizLikeCreateManyQuizInput = {
    id?: string
    userId: string
    createdAt?: Date | string
  }

  export type QuizFavoriteCreateManyQuizInput = {
    id?: string
    userId: string
    createdAt?: Date | string
  }

  export type QuestionUpdateWithoutQuizInput = {
    id?: StringFieldUpdateOperationsInput | string
    question?: StringFieldUpdateOperationsInput | string
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    answers?: QuestionUpdateanswersInput | string[]
    correctAnswer?: StringFieldUpdateOperationsInput | string
    type?: EnumQuestionTypeFieldUpdateOperationsInput | $Enums.QuestionType
  }

  export type QuestionUncheckedUpdateWithoutQuizInput = {
    id?: StringFieldUpdateOperationsInput | string
    question?: StringFieldUpdateOperationsInput | string
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    answers?: QuestionUpdateanswersInput | string[]
    correctAnswer?: StringFieldUpdateOperationsInput | string
    type?: EnumQuestionTypeFieldUpdateOperationsInput | $Enums.QuestionType
  }

  export type QuestionUncheckedUpdateManyWithoutQuizInput = {
    id?: StringFieldUpdateOperationsInput | string
    question?: StringFieldUpdateOperationsInput | string
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    answers?: QuestionUpdateanswersInput | string[]
    correctAnswer?: StringFieldUpdateOperationsInput | string
    type?: EnumQuestionTypeFieldUpdateOperationsInput | $Enums.QuestionType
  }

  export type QuizLikeUpdateWithoutQuizInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type QuizLikeUncheckedUpdateWithoutQuizInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type QuizLikeUncheckedUpdateManyWithoutQuizInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type QuizFavoriteUpdateWithoutQuizInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type QuizFavoriteUncheckedUpdateWithoutQuizInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type QuizFavoriteUncheckedUpdateManyWithoutQuizInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StoryPanelCreateManyStoryInput = {
    id?: string
    order: number
    imageUrl?: string | null
    sceneDescription: string
    imagePrompt?: string | null
    exampleSentence?: string | null
    mouth?: NullableJsonNullValueInput | InputJsonValue
  }

  export type StorySubmissionCreateManyStoryInput = {
    id?: string
    studentName: string
    status?: $Enums.StorySubmissionStatus
    createdAt?: Date | string
  }

  export type StoryPanelUpdateWithoutStoryInput = {
    id?: StringFieldUpdateOperationsInput | string
    order?: IntFieldUpdateOperationsInput | number
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    sceneDescription?: StringFieldUpdateOperationsInput | string
    imagePrompt?: NullableStringFieldUpdateOperationsInput | string | null
    exampleSentence?: NullableStringFieldUpdateOperationsInput | string | null
    mouth?: NullableJsonNullValueInput | InputJsonValue
  }

  export type StoryPanelUncheckedUpdateWithoutStoryInput = {
    id?: StringFieldUpdateOperationsInput | string
    order?: IntFieldUpdateOperationsInput | number
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    sceneDescription?: StringFieldUpdateOperationsInput | string
    imagePrompt?: NullableStringFieldUpdateOperationsInput | string | null
    exampleSentence?: NullableStringFieldUpdateOperationsInput | string | null
    mouth?: NullableJsonNullValueInput | InputJsonValue
  }

  export type StoryPanelUncheckedUpdateManyWithoutStoryInput = {
    id?: StringFieldUpdateOperationsInput | string
    order?: IntFieldUpdateOperationsInput | number
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    sceneDescription?: StringFieldUpdateOperationsInput | string
    imagePrompt?: NullableStringFieldUpdateOperationsInput | string | null
    exampleSentence?: NullableStringFieldUpdateOperationsInput | string | null
    mouth?: NullableJsonNullValueInput | InputJsonValue
  }

  export type StorySubmissionUpdateWithoutStoryInput = {
    id?: StringFieldUpdateOperationsInput | string
    studentName?: StringFieldUpdateOperationsInput | string
    status?: EnumStorySubmissionStatusFieldUpdateOperationsInput | $Enums.StorySubmissionStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    recordings?: StoryRecordingUpdateManyWithoutSubmissionNestedInput
  }

  export type StorySubmissionUncheckedUpdateWithoutStoryInput = {
    id?: StringFieldUpdateOperationsInput | string
    studentName?: StringFieldUpdateOperationsInput | string
    status?: EnumStorySubmissionStatusFieldUpdateOperationsInput | $Enums.StorySubmissionStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    recordings?: StoryRecordingUncheckedUpdateManyWithoutSubmissionNestedInput
  }

  export type StorySubmissionUncheckedUpdateManyWithoutStoryInput = {
    id?: StringFieldUpdateOperationsInput | string
    studentName?: StringFieldUpdateOperationsInput | string
    status?: EnumStorySubmissionStatusFieldUpdateOperationsInput | $Enums.StorySubmissionStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StoryRecordingCreateManySubmissionInput = {
    id?: string
    panelOrder: number
    audioUrl: string
    mimeType: string
    durationMs: number
    envelope?: NullableJsonNullValueInput | InputJsonValue
  }

  export type StoryRecordingUpdateWithoutSubmissionInput = {
    id?: StringFieldUpdateOperationsInput | string
    panelOrder?: IntFieldUpdateOperationsInput | number
    audioUrl?: StringFieldUpdateOperationsInput | string
    mimeType?: StringFieldUpdateOperationsInput | string
    durationMs?: IntFieldUpdateOperationsInput | number
    envelope?: NullableJsonNullValueInput | InputJsonValue
  }

  export type StoryRecordingUncheckedUpdateWithoutSubmissionInput = {
    id?: StringFieldUpdateOperationsInput | string
    panelOrder?: IntFieldUpdateOperationsInput | number
    audioUrl?: StringFieldUpdateOperationsInput | string
    mimeType?: StringFieldUpdateOperationsInput | string
    durationMs?: IntFieldUpdateOperationsInput | number
    envelope?: NullableJsonNullValueInput | InputJsonValue
  }

  export type StoryRecordingUncheckedUpdateManyWithoutSubmissionInput = {
    id?: StringFieldUpdateOperationsInput | string
    panelOrder?: IntFieldUpdateOperationsInput | number
    audioUrl?: StringFieldUpdateOperationsInput | string
    mimeType?: StringFieldUpdateOperationsInput | string
    durationMs?: IntFieldUpdateOperationsInput | number
    envelope?: NullableJsonNullValueInput | InputJsonValue
  }



  /**
   * Aliases for legacy arg types
   */
    /**
     * @deprecated Use QuizCountOutputTypeDefaultArgs instead
     */
    export type QuizCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = QuizCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use StoryCountOutputTypeDefaultArgs instead
     */
    export type StoryCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = StoryCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use StorySubmissionCountOutputTypeDefaultArgs instead
     */
    export type StorySubmissionCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = StorySubmissionCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use QuizDefaultArgs instead
     */
    export type QuizArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = QuizDefaultArgs<ExtArgs>
    /**
     * @deprecated Use QuizLikeDefaultArgs instead
     */
    export type QuizLikeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = QuizLikeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use QuizFavoriteDefaultArgs instead
     */
    export type QuizFavoriteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = QuizFavoriteDefaultArgs<ExtArgs>
    /**
     * @deprecated Use QuestionDefaultArgs instead
     */
    export type QuestionArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = QuestionDefaultArgs<ExtArgs>
    /**
     * @deprecated Use StoredImageDefaultArgs instead
     */
    export type StoredImageArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = StoredImageDefaultArgs<ExtArgs>
    /**
     * @deprecated Use TagDefaultArgs instead
     */
    export type TagArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = TagDefaultArgs<ExtArgs>
    /**
     * @deprecated Use StoryDefaultArgs instead
     */
    export type StoryArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = StoryDefaultArgs<ExtArgs>
    /**
     * @deprecated Use StoryPanelDefaultArgs instead
     */
    export type StoryPanelArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = StoryPanelDefaultArgs<ExtArgs>
    /**
     * @deprecated Use StorySubmissionDefaultArgs instead
     */
    export type StorySubmissionArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = StorySubmissionDefaultArgs<ExtArgs>
    /**
     * @deprecated Use StoryRecordingDefaultArgs instead
     */
    export type StoryRecordingArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = StoryRecordingDefaultArgs<ExtArgs>

  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}