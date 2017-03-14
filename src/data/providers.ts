export interface Work {
    id: number;
    urlName: string;
    name: string;
    updated: Date;
    description: string;
}

export const WORKS: Work[] = [
      {
      id: 0,
      urlName: 'beersd3',
      name: 'Craft Beers Data',
      updated: new Date('1/1/16'),
      description: 'Graph using D3 exploring craft beers'
    },
    {
      id: 1,
      urlName: 'diveshop',
      name: 'Diveshop',
      updated: new Date('1/17/16'),
      description: 'A magazine about diving around the world'
    },
    {
      id: 2,
      urlName: 'chatfm',
      name: 'Chat FM',
      updated: new Date('1/28/16'),
      description: 'A collective chat app'
    }
];

export const BEERS: Array<[number, number]> = [
  [
    0.049, // abv
    17, // ibu
  ],
  [
    0.049,
    17,
  ],
  [
    0.07,
    70,
  ],
  [
    0.07,
    70,
  ],
  [
    0.07,
    70,
  ],
  [
    0.085,
    52,
  ],
  [
    0.09699999999999999,
    94,
  ],
  [
    0.044000000000000004,
    42,
  ],
  [
    0.079,
    45,
  ],
  [
    0.068,
    65,
  ],
  [
    0.083,
    35,
  ],
  [
    0.07,
    65,
  ],
  [
    0.049,
    17,
  ],
  [
    0.07,
    82,
  ],
  [
    0.069,
    65,
  ],
  [
    0.09,
    50,
  ],
  [
    0.046,
    15,
  ],
  [
    0.052000000000000005,
    18,
  ],
  [
    0.059000000000000004,
    75,
  ],
  [
    0.054000000000000006,
    30,
  ],
  [
    0.054000000000000006,
    30,
  ],
  [
    0.084,
    82,
  ],
  [
    0.055,
    26,
  ],
  [
    0.055,
    26,
  ],
  [
    0.065,
    52,
  ],
  [
    0.042,
    13,
  ],
  [
    0.045,
    17,
  ],
  [
    0.08199999999999999,
    68,
  ],
  [
    0.05,
    20,
  ],
  [
    0.08,
    68,
  ],
  [
    0.125,
    80,
  ],
  [
    0.077,
    25,
  ],
  [
    0.042,
    42,
  ],
  [
    0.05,
    25,
  ],
  [
    0.066,
    21,
  ],
  [
    0.04,
    13,
  ],
  [
    0.055,
    17,
  ],
  [
    0.076,
    68,
  ],
  [
    0.051,
    38,
  ]
];
