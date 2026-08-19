(function () {
  var nodes: Record<string, ContentNodeDef> = {};

  LT.defineNode = function (node: ContentNodeDef): ContentNodeDef {
    nodes[node.id] = node;
    return node;
  };

  LT.getNode = function (id: string): ContentNodeDef {
    var node = nodes[id];
    if (!node) throw new Error("Unknown dialogue node: " + id);
    return node;
  };

  LT.hasNode = function (id: string): boolean {
    return !!nodes[id];
  };
})();
