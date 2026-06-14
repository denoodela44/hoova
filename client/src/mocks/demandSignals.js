// Market demand data — replace with accurate dataset
export const DEMAND_SIGNALS = {
  total: 0,
  unique_terms: 0,
  avg_results: 0,
  zero_result_pct: 0,

  // Each entry: { query, count, prev, avg_results, avg_price, category, intent,
  //               price_signal, region_top, opp_score, trend7, rating, competition }
  top_terms: [],

  // Each entry: { query, count, potential_revenue, category_slug }
  zero_results: [],

  // Each entry: { name, count }
  by_category: [{ name: 'Uncategorized', count: 0 }],

  // Each entry: { combination, count }
  keyword_combinations: [],
}
