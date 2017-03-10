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
