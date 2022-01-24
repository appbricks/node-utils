/**
 * Given two lists returns two lists where the first 
 * returned will be the values in the first list that 
 * are not in the second and the values in the second
 * returned will be the values in the second list that 
 * are not in the first.
 * 
 * @param list1  first list
 * @param list2  second list
 * 
 * @returns diffs between the lists
 */
export function calculateDiffs(list1: string[], list2: string[]): [ string[], string[] ] {

  const set1 = new Set(list1);
  const set2 = new Set(list2);

  return [ 
    list1.filter(v => !set2.has(v)), 
    list2.filter(v => !set1.has(v))
  ];
}

