/**
 * 响应格式化工具类
 * 用于统一API响应格式，包含code、msg和data字段
 * 每个方法直接接收res参数并发送响应，避免需要先创建响应对象再单独调用send的情况
 */

class ResponseFormatter {
  /**
   * 发送成功响应
   * @param {Object} res - Express响应对象
   * @param {any} data - 响应数据，默认为null
   * @param {string} message - 响应消息，默认为'操作成功'
   * @param {number} code - 响应状态码，默认为200
   */
  static success(res, data = null, message = '操作成功', code = 200) {
    const responseData = {
      code,
      msg: message,
      data: data === undefined ? null : data
    };
    const statusCode = code >= 100 && code < 600 ? code : 200;
    res.status(statusCode).json(responseData);
  }

  /**
   * 发送失败响应
   * @param {Object} res - Express响应对象
   * @param {string} message - 错误消息，默认为'操作失败'
   * @param {number} code - 错误状态码，默认为500
   * @param {any} data - 额外数据，默认为null
   */
  static error(res, message = '操作失败', code = 500, data = null) {
    const responseData = {
      code,
      msg: message,
      data: data === undefined ? null : data
    };
    const statusCode = code >= 100 && code < 600 ? code : 500;
    res.status(statusCode).json(responseData);
  }

  /**
   * 发送分页响应
   * @param {Object} res - Express响应对象
   * @param {Array} items - 当前页的数据列表
   * @param {number} total - 总记录数
   * @param {number} page - 当前页码
   * @param {number} pageSize - 每页记录数
   * @param {string} message - 响应消息，默认为'获取成功'
   */
  static paginate(res, items = [], total = 0, page = 1, pageSize = 10, message = '获取成功') {
    const totalPages = Math.ceil(total / pageSize);
    const responseData = {
      code: 200,
      msg: message,
      data: {
        items,
        pagination: {
          total,
          page,
          pageSize,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    };
    res.status(200).json(responseData);
  }

  /**
   * 发送参数验证错误响应
   * @param {Object} res - Express响应对象
   * @param {Array} errors - 验证错误信息数组
   * @param {string} message - 响应消息，默认为'参数验证失败'
   */
  static validationError(res, errors = [], message = '参数验证失败') {
    const responseData = {
      code: 400,
      msg: message,
      data: {
        errors
      }
    };
    res.status(400).json(responseData);
  }

  /**
   * 发送未授权响应
   * @param {Object} res - Express响应对象
   * @param {string} message - 响应消息，默认为'未授权访问'
   */
  static unauthorized(res, message = '未授权访问') {
    const responseData = {
      code: 401,
      msg: message,
      data: null
    };
    res.status(401).json(responseData);
  }

  /**
   * 发送禁止访问响应
   * @param {Object} res - Express响应对象
   * @param {string} message - 响应消息，默认为'禁止访问'
   */
  static forbidden(res, message = '禁止访问') {
    const responseData = {
      code: 403,
      msg: message,
      data: null
    };
    res.status(403).json(responseData);
  }

  /**
   * 发送资源未找到响应
   * @param {Object} res - Express响应对象
   * @param {string} message - 响应消息，默认为'资源不存在'
   */
  static notFound(res, message = '资源不存在') {
    const responseData = {
      code: 404,
      msg: message,
      data: null
    };
    res.status(404).json(responseData);
  }

  /**
   * 只创建响应对象而不发送（保留此方法以兼容需要获取响应对象的场景）
   * @param {string} type - 响应类型: 'success', 'error', 'paginate', 'validationError', 'unauthorized', 'forbidden', 'notFound'
   * @param {Array} args - 传递给相应方法的参数（不包括res）
   * @returns {Object} 格式化后的响应对象
   */
  static createResponseObject(type, ...args) {
    const responseMethods = {
      success: (data = null, message = '操作成功', code = 200) => ({
        code,
        msg: message,
        data: data === undefined ? null : data
      }),
      error: (message = '操作失败', code = 500, data = null) => ({
        code,
        msg: message,
        data: data === undefined ? null : data
      }),
      paginate: (items = [], total = 0, page = 1, pageSize = 10, message = '获取成功') => {
        const totalPages = Math.ceil(total / pageSize);
        return {
          code: 200,
          msg: message,
          data: {
            items,
            pagination: {
              total,
              page,
              pageSize,
              totalPages,
              hasNext: page < totalPages,
              hasPrev: page > 1
            }
          }
        };
      },
      validationError: (errors = [], message = '参数验证失败') => ({
        code: 400,
        msg: message,
        data: {
          errors
        }
      }),
      unauthorized: (message = '未授权访问') => ({
        code: 401,
        msg: message,
        data: null
      }),
      forbidden: (message = '禁止访问') => ({
        code: 403,
        msg: message,
        data: null
      }),
      notFound: (message = '资源不存在') => ({
        code: 404,
        msg: message,
        data: null
      })
    };

    if (responseMethods[type]) {
      return responseMethods[type](...args);
    }
    
    // 默认返回错误响应
    return responseMethods.error(`不支持的响应类型: ${type}`);
  }
}

module.exports = ResponseFormatter;