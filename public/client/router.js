Shortly.Router = Backbone.Router.extend({
  initialize: function(options) {
    this.$el = options.el;
  },

  routes: {
    '/': 'index',
    'create': 'create',
    // 'login': 'login',
    // 'signup': 'signup',
    'logout': 'logout'
  },

  swapView: function(view) {
    this.$el.html(view.render().el);
  },

  index: function() {
    var links = new Shortly.Links();
    var linksView = new Shortly.LinksView({ collection: links });
    this.swapView(linksView);
  },

  create: function() {
    this.swapView(new Shortly.createLinkView());
  }

  // logout: function() {
  //   $.ajax({
  //     url: '127.0.0.1:4568/create',
  //     method: 'GET',
  //     success: function() {
  //       console.log('logout finally worked')
  //     },
  //     error: function(error) {
  //       console.log(error);
  //     }
  //   }) 
  // }
});

//ssaas