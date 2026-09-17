// Hand-written per-borough intro copy for the NYC borough pages (SEO audit
// Priority 5, phase 1). Same rationale as city-intros.ts: hand-written per
// page rather than a shared template with the name swapped in.
//
// Manhattan and Queens have a real, current shop count behind them; Brooklyn,
// the Bronx, and Staten Island don't yet (see scripts/backfill-nyc-boroughs.mjs
// and MIN_BOROUGH_SHOP_COUNT in src/utils/data.ts) - their copy says so
// honestly rather than describing a scene that isn't reflected in the listings
// below it.
export const BOROUGH_INTROS: Record<string, string> = {
  manhattan: `Manhattan has the largest concentration of bubble tea shops in the New York metro area covered on this site, with a dense cluster around Chinatown and the Lower East Side (Mott Street, Bayard Street, Grand Street) alongside another strong pocket near Union Square and the East Village along 14th Street. Koreatown on 32nd Street and the stretch of the Upper West Side around Broadway and Amsterdam Avenue each have their own smaller concentrations. Whether you're near the courts downtown, a university uptown, or passing through Midtown, there's very likely a shop within a short walk. Use the filters below to narrow this list by rating, hours, or service options.`,

  queens: `Queens' bubble tea shops on this site are concentrated in Astoria and Long Island City, with a couple more out in Flushing - a smaller list than Manhattan's for now, but a real and growing one. Long Island City in particular has seen new shops open alongside its recent residential growth. Browse the listings below to compare ratings and hours, or check the full New York listing for shops across every borough.`,

  brooklyn: `Brooklyn's bubble tea listings on this site are just getting started - right now that's a single shop in Downtown Brooklyn, with more of the borough's real boba scene (Sunset Park and Bay Ridge both have well-known concentrations) still to be added. Check the full New York listing in the meantime for shops across every borough, and check back here as this page grows.`,

  bronx: `We don't have any Bronx bubble tea shops listed yet - this page is a placeholder while that part of the directory gets built out. Check the full New York listing for shops across the other boroughs in the meantime.`,

  'staten-island': `We don't have any Staten Island bubble tea shops listed yet - this page is a placeholder while that part of the directory gets built out. Check the full New York listing for shops across the other boroughs in the meantime.`,
}
