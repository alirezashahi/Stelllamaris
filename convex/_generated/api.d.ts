/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as addresses from "../addresses.js";
import type * as admin from "../admin.js";
import type * as cart from "../cart.js";
import type * as categories from "../categories.js";
import type * as emails from "../emails.js";
import type * as fileUpload from "../fileUpload.js";
import type * as http from "../http.js";
import type * as orders from "../orders.js";
import type * as paymentMethods from "../paymentMethods.js";
import type * as products from "../products.js";
import type * as promoCodes from "../promoCodes.js";
import type * as returns from "../returns.js";
import type * as reviews from "../reviews.js";
import type * as sampleData from "../sampleData.js";
import type * as sampleVariantData from "../sampleVariantData.js";
import type * as shippingOptions from "../shippingOptions.js";
import type * as users from "../users.js";
import type * as wishlist from "../wishlist.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  addresses: typeof addresses;
  admin: typeof admin;
  cart: typeof cart;
  categories: typeof categories;
  emails: typeof emails;
  fileUpload: typeof fileUpload;
  http: typeof http;
  orders: typeof orders;
  paymentMethods: typeof paymentMethods;
  products: typeof products;
  promoCodes: typeof promoCodes;
  returns: typeof returns;
  reviews: typeof reviews;
  sampleData: typeof sampleData;
  sampleVariantData: typeof sampleVariantData;
  shippingOptions: typeof shippingOptions;
  users: typeof users;
  wishlist: typeof wishlist;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
