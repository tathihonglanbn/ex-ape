Nova.booting((Vue, router) => {
  router.addRoutes([
    {
      name: 'unmatched-milestones',
      path: '/unmatched-milestones',
      component: require('./components/Tool'),
    }
  ])
})
