package com.nexus.common.exception;

import com.nexus.common.api.ErrorCode;

/** Dùng khi người dùng đã xác thực nhưng không sở hữu tài nguyên (ví dụ Seller sửa product của Seller khác). */
public class ForbiddenOperationException extends BusinessException {

    public ForbiddenOperationException(String message) {
        super(ErrorCode.FORBIDDEN, message);
    }
}
