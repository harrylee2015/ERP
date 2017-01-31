$(function() {
    //form中使用select2获得关联表中的数据
    $.fn.select2.defaults.set("language", "zh-CN");
    $.fn.select2.defaults.set("theme", "bootstrap");
    var LIMIT = 5;

    function formatRepo(repo) {
        'use strict';
        if (repo.loading) { return repo.text; }
        return repo.name || repo.Name;
    }

    function formatRepoSelection(repo) {
        'use strict';
        return repo.name || repo.Name || repo.text;
    }
    var selectStaticData = function(selectClass, data) {
        'use strict';
        $(selectClass).each(function(index, el) {
            if (el.id != undefined && el.id != "") {
                var $selectNode = $("#" + el.id);
                $selectNode.select2({
                    data: data,
                    escapeMarkup: function(markup) { return markup; },
                    // minimumInputLength: 1,
                    templateResult: function(repo) {
                        if (repo.loading) { return repo.text; }
                        return repo.name;
                    },
                    templateSelection: function(repo) {
                        return repo.name;
                    }
                });
            }
        });
    };
    //selct2 Ajax 请求，现根据class选择，再根据ID绑定时间，用于后期一个页面多个相同select的情况
    var select2AjaxData = function(selectClass, ajaxUrl, tags) {
        'use strict';
        $(selectClass).each(function(index, el) {
            if (el.id != undefined && el.id != "") {
                var $selectNode = $("#" + el.id);
                nodeSelect2(el.id, ajaxUrl, tags);
            }
        });
    };
    var nodeSelect2 = function(nodeId, ajaxUrl, tags) {
        'use strict';
        $("#" + nodeId).select2({
            width: "off",
            ajax: {
                url: ajaxUrl,
                dataType: 'json',
                delay: 250,
                type: "POST",
                data: function(params) {
                    var selectParams = {
                        name: params.term || "", // search term
                        offset: params.page || 0,
                        limit: LIMIT,
                    };
                    var xsrf = $("input[name ='_xsrf']");
                    if (xsrf.length > 0) {
                        selectParams._xsrf = xsrf[0].value;
                    }
                    if ($(this).length > 0 && $(this)[0].nodeName == "SELECT") {
                        selectParams.exclude = $(this).val();
                    }
                    return selectParams
                },
                processResults: function(data, params) {
                    params.page = params.page || 0;
                    var paginator = JSON.parse(data.paginator);
                    return {
                        results: data.data,
                        pagination: {
                            more: paginator.totalPage > paginator.currentPage
                        }
                    };
                }
            },
            escapeMarkup: function(markup) {
                return markup;
            }, // let our custom formatter work
            minimumInputLength: 0,
            templateResult: formatRepo,
            templateSelection: formatRepoSelection
        });

    };
    select2AjaxData(".select-department", "/department/?action=search"); // 选择部门
    select2AjaxData(".select-position", "/position/?action=search"); // 选择职位
    select2AjaxData(".select-group", "/group/?action=search", true); // 选择分组
    select2AjaxData(".select-product-category", "/product/category/?action=search"); // 选择产品类别;
    select2AjaxData(".select-product-attribute", '/product/attribute/?action=search'); // 选择属性
    select2AjaxData(".select-product-attribute-value", '/product/attributevalue/?action=search'); // 选择属性值
    // selectStaticData(".select-product-type", [{ id: 1, name: '库存商品' }, { id: 2, name: '消耗品' }, { id: 3, name: '服务' }]); // 产品类型
    select2AjaxData(".select-product-uom", "/product/uom/?action=search"); // 选择产品单位
    select2AjaxData(".select-product-uom-category", "/product/uomcateg/?action=search"); //计量单位类别
    selectStaticData(".select-product-uom-category-type", [{ id: 1, name: '小于参考计量单位' }, { id: 2, name: '参考计量单位' }, { id: 3, name: '大于参考计量单位' }]); // 产品类型
    // 根据款式创建产品，款式修改后，需要同时更新产品的类别，销售和采购单位
    $(".select-product-template").select2({
        width: "off",
        ajax: {
            url: "/product/template/?action=search",
            dataType: 'json',
            delay: 250,
            type: "POST",
            data: function(params) {
                var selectParams = {
                    name: params.term || "", // search term
                    offset: params.page || 0,
                    limit: LIMIT,
                };
                var xsrf = $("input[name ='_xsrf']");
                if (xsrf.length > 0) {
                    selectParams._xsrf = xsrf[0].value;
                }
                if ($(this).length > 0 && $(this)[0].nodeName == "SELECT") {
                    selectParams.exclude = $(this).val();
                }
                return selectParams
            },
            processResults: function(data, params) {
                params.page = params.page || 0;
                var paginator = JSON.parse(data.paginator);
                return {
                    results: data.data,
                    pagination: {
                        more: paginator.totalPage > paginator.currentPage
                    }
                };
            }
        },
        escapeMarkup: function(markup) {
            return markup;
        }, // let our custom formatter work
        minimumInputLength: 0,
        templateResult: formatRepo,
        templateSelection: formatRepoSelection
    }).on("change", function(e) {
        var productTempId = parseInt(e.currentTarget.value);
        $.ajax({
            type: 'POST',
            url: "/product/template/?action=search",
            data: (function() {
                var params = { Id: productTempId };
                var xsrf = $("input[name ='_xsrf']");
                if (xsrf.length > 0) {
                    params._xsrf = xsrf[0].value;
                }
                return params;
            })(),
            success: function(result) {
                if (result.data && result.data.length > 0) {
                    var Pdata = result.data[0];
                    $("#name").val(Pdata.Name);
                    $("#product-attributevalues").empty();
                    $("#category").empty().append("<option value='" + Pdata.Category.id + "' selected='selected'>" + Pdata.Category.name + "</option>");
                    $("#firstSaleUom").empty().append("<option value='" + Pdata.FirstSaleUom.id + "' selected='selected'>" + Pdata.FirstSaleUom.name + "</option>");
                    if (Pdata.SecondSaleUom != undefined) {
                        $("#secondSaleUom").empty().append("<option value='" + Pdata.SecondSaleUom.id + "' selected='selected'>" + Pdata.SecondSaleUom.name + "</option>");
                    }
                    $("#firstPurchaseUom").empty().append("<option value='" + Pdata.FirstPurchaseUom.id + "' selected='selected'>" + Pdata.FirstPurchaseUom.name + "</option>");
                    if (Pdata.SecondPurchaseUom != undefined) {
                        $("#secondPurchaseUom").empty().append("<option value='" + Pdata.SecondPurchaseUom.id + "' selected='selected'>" + Pdata.SecondPurchaseUom.name + "</option>");
                    }


                }
            },
            dataType: "json"
        });
    });
    var selectProductProductAttributeValue = function(selector) {
        $(selector).select2({
            width: "off",
            ajax: {
                url: '/product/attributevalue/?action=search',
                dataType: 'json',
                delay: 250,
                type: "POST",
                data: function(params) {
                    var selectParams = {
                        name: params.term || "", // search term
                        offset: params.page || 0,
                        limit: 5,
                    };
                    var xsrf = $("input[name ='_xsrf']");
                    if (xsrf.length > 0) {
                        selectParams._xsrf = xsrf[0].value;
                    }
                    var attributeid = this.data("attributeid");
                    if (attributeid != undefined) {
                        var attributeId = $("#" + attributeid).val();
                        if (attributeId == null) {
                            // 弹框提示
                            toastr.error("请先选择属性", "错误");
                            return;
                        } else {
                            selectParams.attributeId = attributeId;
                        }
                    }
                    if ($(this).length > 0 && $(this)[0].nodeName == "SELECT") {
                        selectParams.exclude = $(this).val();
                    }
                    return selectParams;
                },
                processResults: function(data, params) {
                    params.page = params.page || 0;
                    var paginator = JSON.parse(data.paginator);
                    return {
                        results: data.data,
                        pagination: {
                            more: paginator.totalPage > paginator.currentPage
                        }
                    };
                }

            },
            escapeMarkup: function(markup) {
                return markup;
            }, // let our custom formatter work
            minimumInputLength: 0,
            templateResult: function(repo) {
                'use strict';
                if (repo.loading) { return repo.text; }
                return repo.name;
            },
            templateSelection: function(repo) {
                'use strict';
                return repo.name || repo.text;
            }
        });
    };
    selectProductProductAttributeValue(".select-product-product-attribute-value");
});