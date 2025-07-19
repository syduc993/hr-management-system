// Master data validation service
class MasterDataValidator {
    static validateStoreData(storeData) {
        const errors = [];

        // Required fields validation
        if (!storeData.storeName || storeData.storeName.trim().length < 2) {
            errors.push('Tên cửa hàng phải có ít nhất 2 ký tự');
        }

        if (!storeData.address || storeData.address.trim().length < 5) {
            errors.push('Địa chỉ phải có ít nhất 5 ký tự');
        }

        // Status validation
        if (storeData.status && !['active', 'inactive'].includes(storeData.status)) {
            errors.push('Trạng thái phải là active hoặc inactive');
        }

        return errors;
    }

    static validatePositionData(positionData) {
        const errors = [];

        // Required fields validation
        if (!positionData.positionName || positionData.positionName.trim().length < 2) {
            errors.push('Tên vị trí phải có ít nhất 2 ký tự');
        }

        // Description validation (optional but if provided must be reasonable)
        if (positionData.description && positionData.description.trim().length < 3) {
            errors.push('Mô tả phải có ít nhất 3 ký tự nếu được cung cấp');
        }

        // Status validation
        if (positionData.status && !['active', 'inactive'].includes(positionData.status)) {
            errors.push('Trạng thái phải là active hoặc inactive');
        }

        return errors;
    }

    static validateMasterDataBatch(dataArray, type) {
        const errors = [];
        const names = [];

        dataArray.forEach((item, index) => {
            // Validate individual item
            let itemErrors = [];
            if (type === 'store') {
                itemErrors = this.validateStoreData(item);
            } else if (type === 'position') {
                itemErrors = this.validatePositionData(item);
            }

            if (itemErrors.length > 0) {
                errors.push(`Item ${index + 1}: ${itemErrors.join(', ')}`);
            }

            // Check for duplicate names
            const nameField = type === 'store' ? 'storeName' : 'positionName';
            if (item[nameField] && names.includes(item[nameField])) {
                errors.push(`Item ${index + 1}: Tên đã bị trùng lặp trong batch`);
            } else if (item[nameField]) {
                names.push(item[nameField]);
            }
        });

        return errors;
    }

    static sanitizeStoreData(storeData) {
        return {
            storeName: storeData.storeName?.trim() || '',
            address: storeData.address?.trim() || '',
            status: storeData.status || 'active',
            createdAt: storeData.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    }

    static sanitizePositionData(positionData) {
        return {
            positionName: positionData.positionName?.trim() || '',
            description: positionData.description?.trim() || '',
            status: positionData.status || 'active',
            createdAt: positionData.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    }
}

export default MasterDataValidator;
