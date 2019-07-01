export default function(){///返回第一个非空节点
    for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
        for (var group = groups[j], i = 0, n = group.length; i < n; ++i) {
            var node = group[i];
            if (node) return node;
        }
    }
    return null;
}