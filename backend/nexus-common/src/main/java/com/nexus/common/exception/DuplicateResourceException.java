package com.nexus.common.exception;

import com.nexus.common.api.ErrorCode;

public class DuplicateResourceException extends BusinessException {

    public DuplicateResourceException(String resource, String field, Object value) {
        super(ErrorCode.CONFLICT, resource + " đã tồn tại với " + field + " = " + value);
    }

    public DuplicateResourceException(String message) {
        super(ErrorCode.CONFLICT, message);
    }
}
